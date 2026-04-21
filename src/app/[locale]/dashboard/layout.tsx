import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar user={user} locale={locale} />
      <div className="lg:pl-64">
        <DashboardHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
