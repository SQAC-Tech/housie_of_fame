import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { teamData, transactionId } = body;
        const { teamName, teamLeader, members, teamSize } = teamData;

        await connectToDatabase();

        // Duplicate check
        const existing = await Team.findOne({ 'teamLeader.email': teamLeader.email });
        if (existing) {
            return NextResponse.json({ error: 'This email has already been registered.' }, { status: 409 });
        }

        const teamCount = await Team.countDocuments();
        const teamId = `HOU-${(teamCount + 1).toString().padStart(3, '0')}`;
        const amountPaid = Number(teamSize) * 50;

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
            members: members.map((m: any) => ({
                name: m.name.trim(),
                email: m.email.trim().toLowerCase(),
                collegeEmail: m.collegeEmail.trim().toLowerCase(),
                regNo: m.regNo.trim().toUpperCase(),
                phone: m.phone.trim(),
            })),
            teamSize: Number(teamSize),
            amountPaid,
            paymentId: transactionId,
            paymentStatus: 'PENDING',
        });

        return NextResponse.json({
            success: true,
            teamId: team.teamId,
            teamName: team.teamName,
            message: 'Registration submitted. Please wait for admin verification.'
        });
    } catch (err) {
        console.error('[register-manual]', err);
        return NextResponse.json({ error: 'Failed to submit registration.' }, { status: 500 });
    }
}
