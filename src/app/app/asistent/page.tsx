import { loadMembers, requireMembership } from '@/lib/household';
import { Chat } from './Chat';

export const metadata = { title: 'Asistent · Wealth Tracker' };

export default async function AssistantPage() {
  const { user, household } = await requireMembership();
  const members = await loadMembers(household.id);
  const me = members.find((m) => m.userId === user.id);
  return (
    <div className="mx-auto max-w-3xl">
      <Chat name={me?.name ?? 'acolo'} />
      <p className="mt-4 text-center text-xs text-muted">
        Asistentul vede doar tranzacțiile gospodăriei voastre. Sfaturile lui sunt opinii, nu consultanță financiară
        autorizată.
      </p>
    </div>
  );
}
