'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Star,
  Clock,
  RefreshCw,
  CheckCircle,
  ShoppingCart,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface ServiceDetailsProps {
  service: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    shortDescEn: string | null;
    shortDescAr: string | null;
    image: string | null;
    gallery: string[];
    type: string;
    averageRating: number;
    totalReviews: number;
    category: {
      nameEn: string;
      nameAr: string;
      slug: string;
    };
    subcategory: {
      nameEn: string;
      nameAr: string;
      slug: string;
    } | null;
    pricingTiers: Array<{
      id: string;
      tier: string;
      nameEn: string;
      nameAr: string;
      descriptionEn: string | null;
      descriptionAr: string | null;
      price: number;
      deliveryDays: number;
      revisions: number;
      features: string[];
    }>;
    addOns: Array<{
      id: string;
      nameEn: string;
      nameAr: string;
      price: number;
      deliveryDays: number;
    }>;
    bookingConfig: {
      duration: number;
      price: number;
      timeSlots: Array<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;
    } | null;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      order: {
        customer: {
          user: {
            firstName: string;
            lastName: string;
            avatar: string | null;
          };
        };
      };
    }>;
  };
  locale: string;
}

export function ServiceDetails({ service, locale }: ServiceDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const isArabic = locale === 'ar';

  const [selectedTier, setSelectedTier] = useState(service.pricingTiers[0]?.id || '');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  const selectedPricingTier = service.pricingTiers.find((t) => t.id === selectedTier);
  const selectedAddOnItems = service.addOns.filter((a) => selectedAddOns.includes(a.id));

  const subtotal = (selectedPricingTier ? Number(selectedPricingTier.price) : 0) +
    selectedAddOnItems.reduce((sum, a) => sum + Number(a.price), 0);

  const totalDeliveryDays = (selectedPricingTier?.deliveryDays || 0) +
    selectedAddOnItems.reduce((sum, a) => sum + a.deliveryDays, 0);

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleOrder = async () => {
    if (!selectedTier) {
      toast({
        title: 'Please select a package',
        variant: 'destructive',
      });
      return;
    }

    setIsOrdering(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          pricingTierId: selectedTier,
          addOnIds: selectedAddOns,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const { order } = await response.json();
      toast({
        title: 'Order created successfully!',
        description: `Order #${order.orderNumber}`,
      });
      router.push(`/${locale}/dashboard/orders/${order.id}`);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to create order',
        variant: 'destructive',
      });
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${locale}/services`} className="hover:text-primary">
          Services
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/${locale}/services?category=${service.category.slug}`} className="hover:text-primary">
          {isArabic ? service.category.nameAr : service.category.nameEn}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {isArabic ? service.nameAr : service.nameEn}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {isArabic ? service.category.nameAr : service.category.nameEn}
              </Badge>
              {service.totalReviews > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{Number(service.averageRating).toFixed(1)}</span>
                  <span className="text-muted-foreground">({service.totalReviews} reviews)</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {isArabic ? service.nameAr : service.nameEn}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? service.shortDescAr : service.shortDescEn}
            </p>
          </div>

          {/* Image */}
          {service.image && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={service.image}
                alt={isArabic ? service.nameAr : service.nameEn}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({service.totalReviews})
              </TabsTrigger>
              {service.bookingConfig && (
                <TabsTrigger value="booking">Book Appointment</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{isArabic ? service.descriptionAr : service.descriptionEn}</p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {service.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-6">
                  {service.reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={review.order.customer.user.avatar || undefined} />
                        <AvatarFallback>
                          {review.order.customer.user.firstName[0]}
                          {review.order.customer.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {review.order.customer.user.firstName} {review.order.customer.user.lastName}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatDate(review.createdAt, locale)}
                        </p>
                        {review.comment && <p className="text-sm">{review.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {service.bookingConfig && (
              <TabsContent value="booking" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Book an Appointment</CardTitle>
                    <CardDescription>
                      Duration: {service.bookingConfig.duration} minutes •{' '}
                      {formatCurrency(Number(service.bookingConfig.price))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link href={`/${locale}/services/${service.slug}/book`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Appointment
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Pricing Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>{t('services.pricing')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.pricingTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTier === tier.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">
                        {isArabic ? tier.nameAr : tier.nameEn}
                      </h4>
                      <span className="text-xl font-bold">
                        {formatCurrency(Number(tier.price))}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tier.deliveryDays} days
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4" />
                        {tier.revisions} revisions
                      </span>
                    </div>
                    {tier.features.length > 0 && (
                      <ul className="space-y-1">
                        {tier.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Add-ons */}
            {service.addOns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('services.addOns')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.addOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={addOn.id}
                          checked={selectedAddOns.includes(addOn.id)}
                          onCheckedChange={() => toggleAddOn(addOn.id)}
                        />
                        <Label htmlFor={addOn.id} className="cursor-pointer">
                          {isArabic ? addOn.nameAr : addOn.nameEn}
                        </Label>
                      </div>
                      <span className="font-medium">
                        +{formatCurrency(Number(addOn.price))}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPricingTier && (
                  <div className="flex justify-between">
                    <span>{isArabic ? selectedPricingTier.nameAr : selectedPricingTier.nameEn}</span>
                    <span>{formatCurrency(Number(selectedPricingTier.price))}</span>
                  </div>
                )}
                {selectedAddOnItems.map((addOn) => (
                  <div key={addOn.id} className="flex justify-between text-sm">
                    <span>{isArabic ? addOn.nameAr : addOn.nameEn}</span>
                    <span>{formatCurrency(Number(addOn.price))}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Delivery in {totalDeliveryDays} days</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleOrder}
                  disabled={!selectedTier || isOrdering}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isOrdering ? 'Processing...' : t('services.orderNow')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
