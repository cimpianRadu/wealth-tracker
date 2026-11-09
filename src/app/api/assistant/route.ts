import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { findMembership, loadMembers, recordAiCall, todayIso, underAiLimit } from '@/lib/household';
import { aiConfigured } from '@/lib/ai/client';
import { askAssistant, type ChatMessage } from '@/lib/ai/assistant';

export const maxDuration = 120;

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nu ești autentificat.' }, { status: 401 });
  const membership = await findMembership(user.id);
  if (!membership) return NextResponse.json({ error: 'Nu faci parte dintr-o gospodărie.' }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: 'Cheia ANTHROPIC_API_KEY nu e setată pe server.' }, { status: 503 });
  if (!(await underAiLimit(user.id, 'assistant'))) {
    return NextResponse.json({ error: 'Ai atins limita de întrebări pe azi.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const raw = Array.isArray(body?.messages) ? body.messages : [];
  // Istoricul stă doar în browser; aici primim ultimele 20 de mesaje.
  const messages: ChatMessage[] = raw
    .slice(-20)
    .filter((m): m is ChatMessage => !!m && typeof m === 'object' && ['user', 'assistant'].includes((m as ChatMessage).role))
    .map((m) => ({ role: m.role, content: String(m.content ?? '').slice(0, 4000) }))
    .filter((m) => m.content.trim());
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Scrie o întrebare.' }, { status: 400 });
  }
  // API-ul cere ca prima replică să fie a utilizatorului.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const members = await loadMembers(membership.household.id);
  const me = members.find((m) => m.userId === user.id);
  try {
    await recordAiCall(user.id, 'assistant');
    const reply = await askAssistant({
      household: membership.household,
      members,
      userName: me?.name ?? user.email,
      today: todayIso(),
      messages,
    });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[asistent]', err);
    return NextResponse.json({ error: 'Asistentul nu a putut răspunde. Încearcă din nou.' }, { status: 502 });
  }
}
