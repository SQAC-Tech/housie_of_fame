import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Team from '@/models/Team';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.ADMIN_PASSWORD}`;
  return auth === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const teams = await Team.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[admin/teams]', err);
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
}
