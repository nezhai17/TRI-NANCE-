import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { executeCopilotAction } from '@/lib/store/repository';
import { CopilotActionProposal } from '@/lib/intelligence/copilot-engine';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action as CopilotActionProposal;

    if (!action || !action.id || !action.actionType) {
      return NextResponse.json({ error: 'Valid action proposal required.' }, { status: 400 });
    }

    if (!body.confirmed) {
      return NextResponse.json(
        { error: 'Consequential action requires explicit confirmation flag.' },
        { status: 400 }
      );
    }

    const result = await executeCopilotAction(user.id, action);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Action execution failed.' },
      { status: 500 }
    );
  }
}
