import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, Mail, Phone, Search } from 'lucide-react';
import Link from 'next/link';

export default async function AdminCustomersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { search?: string; page?: string };
}) {
  const t = useTranslations();
  const search = searchParams.search;
  const page = parseInt(searchParams.page || '1');
  const limit = 10;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            orders: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.customers')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search customers..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {total} customers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={customer.user.avatar || undefined} />
                    <AvatarFallback>
                      {customer.user.firstName[0]}
                      {customer.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {customer.user.firstName} {customer.user.lastName}
                      </h3>
                      <Badge
                        variant={customer.user.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {customer.user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.user.email}
                      </span>
                      {customer.user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.user.phone}
                        </span>
                      )}
                    </div>
                    {customer.companyName && (
                      <p className="text-sm text-muted-foreground">
                        {customer.companyName}
                      </p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {customer.tags.map((ct) => (
                        <Badge key={ct.tagId} variant="outline" className="text-xs">
                          {ct.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {customer._count.orders} orders
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(Number(customer.lifetimeValue))} LTV
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm">
                      {formatDate(customer.user.createdAt, locale)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/admin/customers/${customer.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, i) => (
                <Link
                  key={i}
                  href={`/${locale}/admin/customers?page=${i + 1}${search ? `&search=${search}` : ''}`}
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
    </div>
  );
}
