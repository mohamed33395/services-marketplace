import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSupportPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; priority?: string; page?: string };
}) {
  const t = useTranslations();
  const status = searchParams.status;
  const priority = searchParams.priority;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  const [tickets, total, statusCounts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusTabs = [
    { value: 'all', label: 'All', count: total },
    { value: 'OPEN', label: 'Open', count: statusCounts.find(s => s.status === 'OPEN')?._count || 0 },
    { value: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0 },
    { value: 'WAITING', label: 'Waiting', count: statusCounts.find(s => s.status === 'WAITING')?._count || 0 },
    { value: 'RESOLVED', label: 'Resolved', count: statusCounts.find(s => s.status === 'RESOLVED')?._count || 0 },
    { value: 'CLOSED', label: 'Closed', count: statusCounts.find(s => s.status === 'CLOSED')?._count || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.support')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer support tickets
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.find(s => s.status === 'OPEN')?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statusCounts.find(s => s.status === 'WAITING')?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.find(s => s.status === 'RESOLVED')?._count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="mb-4">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={`/${locale}/admin/support?status=${tab.value}`}>
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={status || 'all'}>
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>{total} tickets found</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No tickets found
                </p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{ticket.ticketNumber}
                          </span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>
                            {ticket.customer.user.firstName} {ticket.customer.user.lastName}
                          </span>
                          <span>{ticket.customer.user.email}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket._count.messages} messages
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            {formatDate(ticket.createdAt, locale)}
                          </p>
                          {ticket.messages[0] && (
                            <p className="text-xs text-muted-foreground">
                              Last reply: {formatDate(ticket.messages[0].createdAt, locale)}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${locale}/admin/support/${ticket.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <Link
                      key={i}
                      href={`/${locale}/admin/support?status=${status || 'all'}&page=${i + 1}`}
                    >
                      <Button
                        variant={page === i + 1 ? 'default' : 'outline'}
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
