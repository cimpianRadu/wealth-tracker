import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { findMembership, loadMembers, recordAiCall, underAiLimit } from '@/lib/household';
import { aiConfigured } from '@/lib/ai/client';
import { extractStatement, pdfToText } from '@/lib/ai/extract';

// Citirea poate dura 30-90 de secunde pe un extras lung.
export const maxDuration = 300;

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nu ești autentificat.' }, { status: 401 });
  const membership = await findMembership(user.id);
  if (!membership) return NextResponse.json({ error: 'Nu faci parte dintr-o gospodărie.' }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: 'Cheia ANTHROPIC_API_KEY nu e setată pe server.' }, { status: 503 });
  if (!(await underAiLimit(user.id, 'extract'))) {
    return NextResponse.json({ error: 'Ai atins limita de 30 de extrase pe zi. Încearcă mâine.' }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Alege un fișier PDF.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Fișierul e mai mare de 4 MB.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') {
    return NextResponse.json({ error: 'Fișierul nu e un PDF.' }, { status: 400 });
  }

  // PDF-ul nu se salvează nicăieri: îl citim în memorie și păstrăm doar tranzacțiile.
  let text: string;
  try {
    text = await pdfToText(bytes);
  } catch {
    return NextResponse.json({ error: 'Nu am putut citi PDF-ul. E protejat cu parolă?' }, { status: 400 });
  }
  if (text.replace(/\s/g, '').length < 200) {
    return NextResponse.json(
      { error: 'PDF-ul pare scanat (fără text). Descarcă extrasul direct din aplicația băncii.' },
      { status: 400 },
    );
  }

  const members = await loadMembers(membership.household.id);
  const me = members.find((m) => m.userId === user.id);
  const others = members.filter((m) => m.userId !== user.id);
  try {
    await recordAiCall(user.id, 'extract');
    const draft = await extractStatement(text, {
      uploaderNames: [me?.name ?? '', ...(me?.aliases ?? []), user.name ?? ''].filter(Boolean),
      partnerNames: others.flatMap((m) => [m.name, ...m.aliases]),
      partnerTransfers: membership.household.partnerTransfers,
      rates: membership.household.rates,
    });
    return NextResponse.json({ ...draft, fileName: file.name.slice(0, 120) });
  } catch (err) {
    console.error('[extrase] parse:', err);
    return NextResponse.json({ error: 'Citirea extrasului a eșuat. Încearcă din nou.' }, { status: 502 });
  }
}
