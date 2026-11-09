import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth/session';
import { db, str } from '@/lib/db';
import { hashInviteToken } from '@/lib/auth/tokens';
import { findMembership } from '@/lib/household';
import { acceptInvite } from '@/lib/actions/household';

export const metadata = { title: 'Invitație · Wealth Tracker' };

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ eroare?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const user = await currentUser();
  if (!user) redirect(`/intra?next=${encodeURIComponent(`/invitatie/${token}`)}`);

  const hash = await hashInviteToken(token);
  const [inv] = await db()`
    SELECT h.name AS household, m.display_name AS inviter FROM invites i
    JOIN households h ON h.id = i.household_id
    LEFT JOIN household_members m ON m.household_id = i.household_id AND m.user_id = i.created_by
    WHERE i.token_hash = ${hash} AND i.accepted_at IS NULL AND i.expires_at > now()
  `;
  const already = await findMembership(user.id);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      {!inv || sp.eroare ? (
        <>
          <h1 className="font-display text-3xl">Invitația nu mai e valabilă</h1>
          <p className="mt-2 text-muted">A expirat sau a fost deja folosită. Cere un link nou de la cine te-a invitat.</p>
        </>
      ) : already ? (
        <>
          <h1 className="font-display text-3xl">Ești deja într-o gospodărie</h1>
          <p className="mt-2 text-muted">
            Contul tău face parte din „{already.household.name}”. Deocamdată un cont poate fi într-o singură gospodărie.
          </p>
          <Link href="/app" className="btn mt-6">
            Mergi la aplicație
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl">{str(inv.inviter) || 'Cineva'} te invită</h1>
          <p className="mt-2 text-muted">
            în gospodăria „{str(inv.household)}”. Veți vedea amândoi cheltuielile casei, iar fiecare își încarcă propriile
            extrase.
          </p>
          <form action={acceptInvite} className="mt-8 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Cum te cheamă
              </label>
              <input id="name" name="name" className="field mt-1" defaultValue={user.name ?? ''} required />
            </div>
            <button className="btn btn-accent w-full py-3">Accept invitația</button>
          </form>
        </>
      )}
    </main>
  );
}
