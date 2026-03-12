import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import Team from '@/models/Team';
import { sendConfirmationEmail } from '@/lib/mailer';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      teamData,
    } = body;

    // 1. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // 2. Re-validate teamData on backend
    const { teamName, teamLeader, members, teamSize } = teamData;

    if (!teamName?.trim()) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }
    if (![2, 3].includes(Number(teamSize))) {
      return NextResponse.json({ error: 'Invalid team size.' }, { status: 400 });
    }
    if (
      !teamLeader?.name?.trim() ||
      !validateEmail(teamLeader.email) ||
      !validateEmail(teamLeader.collegeEmail) ||
      !teamLeader.regNo?.trim() ||
      !validatePhone(teamLeader.phone)
    ) {
      return NextResponse.json({ error: 'Invalid leader details.' }, { status: 400 });
    }

    const expectedExtras = Number(teamSize) - 1;
    if (!Array.isArray(members) || members.length !== expectedExtras) {
      return NextResponse.json({ error: 'Incorrect number of members.' }, { status: 400 });
    }
    for (const m of members) {
      if (
        !m.name?.trim() ||
        !validateEmail(m.email) ||
        !validateEmail(m.collegeEmail) ||
        !m.regNo?.trim() ||
        !validatePhone(m.phone)
      ) {
        return NextResponse.json({ error: `Invalid details for member: ${m.name}` }, { status: 400 });
      }
    }

    await connectToDatabase();

    // 3. Duplicate check again (race condition safety)
    const existing = await Team.findOne({ 'teamLeader.email': teamLeader.email });
    if (existing) {
      return NextResponse.json(
        { error: 'This email has already been registered.' },
        { status: 409 }
      );
    }

    // 4. Generate unique Team ID atomically
    const teamCount = await Team.countDocuments();
    const teamId = `HOU-${(teamCount + 1).toString().padStart(3, '0')}`;
    const amountPaid = Number(teamSize) * 50;

    // 5. Save to DB
    const team = await Team.create({
      teamId,
      teamName: teamName.trim(),
      teamLeader: {
        name: teamLeader.name.trim(),
        email: teamLeader.email.trim().toLowerCase(),
        collegeEmail: teamLeader.collegeEmail.trim().toLowerCase(),
        regNo: teamLeader.regNo.trim().toUpperCase(),
        phone: teamLeader.phone.trim(),
      },
      members: members.map((m: { name: string; email: string; collegeEmail: string; regNo: string; phone: string }) => ({
        name: m.name.trim(),
        email: m.email.trim().toLowerCase(),
        collegeEmail: m.collegeEmail.trim().toLowerCase(),
        regNo: m.regNo.trim().toUpperCase(),
        phone: m.phone.trim(),
      })),
      teamSize: Number(teamSize),
      amountPaid,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentStatus: 'PAID',
    });

    // 6. Send confirmation emails (non-blocking)
    sendConfirmationEmail({
      teamId: team.teamId,
      teamName: team.teamName,
      teamLeader: team.teamLeader,
      members: team.members,
      teamSize: team.teamSize,
      amountPaid: team.amountPaid,
    }).catch((err) => console.error('[mailer]', err));

    // 7. Return success
    return NextResponse.json({
      success: true,
      teamId: team.teamId,
      teamName: team.teamName,
      members: [team.teamLeader, ...team.members],
      amountPaid: team.amountPaid,
    });
  } catch (err: unknown) {
    console.error('[verify-payment]', err);
    // Handle unique constraint errors
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: 'This email or Team ID already exists. Please contact support.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to complete registration. Please contact support.' },
      { status: 500 }
    );
  }
}
