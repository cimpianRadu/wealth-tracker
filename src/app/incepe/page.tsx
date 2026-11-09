import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { findMembership } from '@/lib/household';
import { createHousehold } from '@/lib/actions/household';

export const metadata = { title: 'Începe · Wealth Tracker' };

export default async function Onboarding() {
  const user = await requireUser();
  if (await findMembership(user.id)) redirect('/app');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl">Bun venit</h1>
      <p className="mt-2 text-muted">
        Creează gospodăria, apoi îți inviți partenerul cu un link. Dacă ai primit deja o invitație, deschide linkul din
        ea.
      </p>
      <form action={createHousehold} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Cum te cheamă
          </label>
          <input id="name" name="name" className="field mt-1" defaultValue={user.name ?? ''} placeholder="Radu" required />
        </div>
        <div>
          <label htmlFor="household" className="block text-sm font-medium">
            Numele gospodăriei
          </label>
          <input id="household" name="household" className="field mt-1" placeholder="Casa noastră" />
        </div>
        <button className="btn btn-accent w-full py-3">Creează gospodăria</button>
      </form>
    </main>
  );
}
