'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Calendar,
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  Target,
  MessageSquare,
  CreditCard,
  Tags,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminSidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    role: string;
  };
  locale: string;
}

export function AdminSidebar({ user, locale }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const navigation = [
    {
      name: t('admin.dashboard'),
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
    },
    {
      name: t('admin.services'),
      href: `/${locale}/admin/services`,
      icon: Package,
    },
    {
      name: t('admin.orders'),
      href: `/${locale}/admin/orders`,
      icon: ShoppingBag,
      badge: 5,
    },
    {
      name: t('admin.customers'),
      href: `/${locale}/admin/customers`,
      icon: Users,
    },
    {
      name: t('admin.bookings'),
      href: `/${locale}/admin/bookings`,
      icon: Calendar,
    },
    {
      name: t('admin.quotes'),
      href: `/${locale}/admin/quotes`,
      icon: FileText,
      badge: 3,
    },
    {
      name: 'Payments',
      href: `/${locale}/admin/payments`,
      icon: CreditCard,
    },
  ];

  const crmNavigation = [
    {
      name: t('crm.leads'),
      href: `/${locale}/admin/crm/leads`,
      icon: Target,
    },
    {
      name: t('crm.pipeline'),
      href: `/${locale}/admin/crm/pipeline`,
      icon: Tags,
    },
    {
      name: 'Conversations',
      href: `/${locale}/admin/crm/conversations`,
      icon: MessageSquare,
    },
  ];

  const supportNavigation = [
    {
      name: t('admin.support'),
      href: `/${locale}/admin/support`,
      icon: HelpCircle,
      badge: 8,
    },
  ];

  const analyticsNavigation = [
    {
      name: t('admin.analytics'),
      href: `/${locale}/admin/analytics`,
      icon: BarChart3,
    },
    {
      name: t('admin.settings'),
      href: `/${locale}/admin/settings`,
      icon: Settings,
    },
  ];

  const NavSection = ({
    title,
    items,
  }: {
    title?: string;
    items: typeof navigation;
  }) => (
    <li>
      {title && (
        <div className="text-xs font-semibold leading-6 text-muted-foreground px-2 mb-2">
          {title}
        </div>
      )}
      <ul role="list" className="-mx-2 space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={cn(
                'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge
                  variant={pathname === item.href ? 'secondary' : 'default'}
                  className="h-5 min-w-[20px] flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href={`/${locale}/admin`} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <div>
              <span className="font-bold text-lg block">{t('common.appName')}</span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <NavSection items={navigation} />
              <NavSection title={t('crm.title')} items={crmNavigation} />
              <NavSection title={t('admin.support')} items={supportNavigation} />
              <NavSection title="System" items={analyticsNavigation} />
            </ul>
          </nav>
        </ScrollArea>

        {/* User Info */}
        <div className="flex items-center gap-x-4 border-t pt-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
