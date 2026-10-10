import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, updateUserPassword } from '@/lib/store/repository';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const body = await req.json();

    if (body.type === 'password') {
      await updateUserPassword(user.id, body.oldPassword, body.newPassword);
      return NextResponse.json({ message: 'Password updated successfully.' });
    }

    const updated = await updateUserProfile(user.id, {
      fullName: body.fullName,
      preferences: body.preferences,
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 400 }
    );
  }
}
