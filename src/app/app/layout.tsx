import { requireMembership } from '@/lib/household';
import { AppNav } from '@/components/AppNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { household } = await requireMembership();
  return (
    <>
      <AppNav base="/app" householdName={household.name} />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">{children}</main>
    </>
  );
}
