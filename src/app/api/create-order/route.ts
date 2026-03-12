import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import getRazorpay from '@/lib/razorpay';
import Team from '@/models/Team';

export async function POST(req: NextRequest) {
  try {
    const { teamSize, allEmails } = await req.json();

    // Validate team size
    if (![2, 3].includes(Number(teamSize))) {
      return NextResponse.json(
        { error: 'Team size must be 2 or 3.' },
        { status: 400 }
      );
    }

    // Validate emails array
    if (!Array.isArray(allEmails) || allEmails.length === 0) {
      return NextResponse.json(
        { error: 'Valid emails are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Check Registration Limits
    // Max 50 teams or 135 members total
    const [totalTeams, totalMembersAgg] = await Promise.all([
      Team.countDocuments({ paymentStatus: 'PAID' }),
      Team.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, totalMembers: { $sum: "$teamSize" } } }
      ])
    ]);

    const currentTotalMembers = totalMembersAgg.length > 0 ? totalMembersAgg[0].totalMembers : 0;

    if (totalTeams >= 50) {
      return NextResponse.json(
        { error: 'Registration full: Maximum 50 teams capacity reached.' },
        { status: 403 }
      );
    }

    if (currentTotalMembers + Number(teamSize) > 135) {
      return NextResponse.json(
        { error: `Registration full: Cannot fit team of ${teamSize}. Only ${135 - currentTotalMembers} spots left.` },
        { status: 403 }
      );
    }

    // 2. Global Duplicate Email Check
    // Prevent any of the provided emails from appearing in *any* PAID team (leader or members)
    const existingMems = await Team.findOne({
      paymentStatus: 'PAID',
      $or: [
        { 'teamLeader.email': { $in: allEmails } },
        { 'members.email': { $in: allEmails } }
      ]
    });

    if (existingMems) {
      return NextResponse.json(
        { error: 'One or more emails provided are already registered in a paid team.' },
        { status: 409 }
      );
    }

    const amount = Number(teamSize) * 50 * 100; // paise

    const order = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
