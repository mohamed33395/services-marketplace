import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      await deleteSession(session.userId);
    }

    const cookieStore = await cookies();
    cookieStore.delete('token');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
