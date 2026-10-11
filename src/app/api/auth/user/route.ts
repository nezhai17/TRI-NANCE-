import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, SESSION_COOKIE_NAME } from '@/lib/auth';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '@/lib/store/repository';

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

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const body = await req.json();
    const password = body.password;
    if (!password) {
      return NextResponse.json({ error: 'Current password is required to delete account.' }, { status: 400 });
    }

    await deleteUserAccount(user.id, password);

    const res = NextResponse.json({ success: true, message: 'Account and associated records purged successfully.' });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete account.' },
      { status: 400 }
    );
  }
}
