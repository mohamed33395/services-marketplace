import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar user={user} locale={locale} />
      <div className="lg:pl-72">
        <AdminHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
