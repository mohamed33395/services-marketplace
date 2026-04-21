import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { Eye, Plus, Search, Mail, Phone, Building } from 'lucide-react';
import Link from 'next/link';

const leadStatusColors: Record<string, string> = {
  NEW: 'bg-blue-500 text-white',
  CONTACTED: 'bg-yellow-500 text-white',
  QUALIFIED: 'bg-green-500 text-white',
  PROPOSAL: 'bg-purple-500 text-white',
  NEGOTIATION: 'bg-orange-500 text-white',
  WON: 'bg-emerald-600 text-white',
  LOST: 'bg-red-500 text-white',
};

export default async function AdminLeadsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; source?: string; search?: string; page?: string };
}) {
  const t = useTranslations();
  const status = searchParams.status;
  const source = searchParams.source;
  const search = searchParams.search;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (source) {
    where.source = source;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [leads, total, statusCounts] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusTabs = [
    { value: 'all', label: 'All', count: total },
    { value: 'NEW', label: 'New', count: statusCounts.find(s => s.status === 'NEW')?._count || 0 },
    { value: 'CONTACTED', label: 'Contacted', count: statusCounts.find(s => s.status === 'CONTACTED')?._count || 0 },
    { value: 'QUALIFIED', label: 'Qualified', count: statusCounts.find(s => s.status === 'QUALIFIED')?._count || 0 },
    { value: 'PROPOSAL', label: 'Proposal', count: statusCounts.find(s => s.status === 'PROPOSAL')?._count || 0 },
    { value: 'WON', label: 'Won', count: statusCounts.find(s => s.status === 'WON')?._count || 0 },
    { value: 'LOST', label: 'Lost', count: statusCounts.find(s => s.status === 'LOST')?._count || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('crm.leads')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales pipeline and leads
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/crm/leads/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search leads..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="source"
              defaultValue={source}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="PAID_ADS">Paid Ads</option>
              <option value="EMAIL">Email</option>
              <option value="OTHER">Other</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.find(s => s.status === 'NEW')?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.find(s => s.status === 'QUALIFIED')?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {statusCounts.find(s => s.status === 'WON')?._count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={`/${locale}/admin/crm/leads?status=${tab.value}`}>
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
              <CardTitle>Leads</CardTitle>
              <CardDescription>{total} leads found</CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No leads found
                </p>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          <Badge className={leadStatusColors[lead.status] || 'bg-gray-500'}>
                            {lead.status}
                          </Badge>
                          <Badge variant="outline">
                            {lead.source}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.companyName && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.companyName}
                            </span>
                          )}
                        </div>
                        {lead.activities[0] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last activity: {lead.activities[0].description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            {formatDate(lead.createdAt, locale)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${locale}/admin/crm/leads/${lead.id}`}>
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
                      href={`/${locale}/admin/crm/leads?status=${status || 'all'}&page=${i + 1}`}
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
