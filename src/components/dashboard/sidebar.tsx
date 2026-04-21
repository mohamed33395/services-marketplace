'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  CreditCard,
  HelpCircle,
  Settings,
  FileText,
  MessageSquare,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardSidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    role: string;
  };
  locale: string;
}

export function DashboardSidebar({ user, locale }: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const navigation = [
    {
      name: t('dashboard.overview'),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: t('orders.myOrders'),
      href: `/${locale}/dashboard/orders`,
      icon: ShoppingBag,
    },
    {
      name: t('bookings.myBookings'),
      href: `/${locale}/dashboard/bookings`,
      icon: Calendar,
    },
    {
      name: t('subscriptions.mySubscriptions'),
      href: `/${locale}/dashboard/subscriptions`,
      icon: CreditCard,
    },
    {
      name: t('quotes.title'),
      href: `/${locale}/dashboard/quotes`,
      icon: FileText,
    },
    {
      name: t('nav.messages'),
      href: `/${locale}/dashboard/messages`,
      icon: MessageSquare,
    },
    {
      name: t('support.myTickets'),
      href: `/${locale}/dashboard/support`,
      icon: HelpCircle,
    },
  ];

  const secondaryNavigation = [
    {
      name: t('profile.title'),
      href: `/${locale}/dashboard/profile`,
      icon: User,
    },
    {
      name: t('profile.notifications'),
      href: `/${locale}/dashboard/notifications`,
      icon: Bell,
    },
    {
      name: t('nav.settings'),
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="font-bold text-lg">{t('common.appName')}</span>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
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
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li>
                <div className="text-xs font-semibold leading-6 text-muted-foreground">
                  {t('nav.settings')}
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {secondaryNavigation.map((item) => (
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
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
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
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
