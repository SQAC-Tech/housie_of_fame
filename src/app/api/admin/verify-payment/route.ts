import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Team from '@/models/Team';
import { sendConfirmationEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { teamId } = await req.json();

        await connectToDatabase();

        const team = await Team.findOneAndUpdate(
            { teamId },
            { paymentStatus: 'PAID' },
            { new: true }
        );

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Send confirmation email
        await sendConfirmationEmail({
            teamId: team.teamId,
            teamName: team.teamName,
            teamLeader: team.teamLeader,
            members: team.members,
            teamSize: team.teamSize,
            amountPaid: team.amountPaid,
        }).catch((err) => console.error('[mailer]', err));

        return NextResponse.json({ success: true, team });
    } catch (err) {
        console.error('[admin/verify-payment]', err);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
