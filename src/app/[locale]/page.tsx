import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Brain,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';

const serviceCategories = [
  {
    icon: Code,
    slug: 'digital',
    color: 'bg-blue-500',
  },
  {
    icon: Brain,
    slug: 'ai',
    color: 'bg-purple-500',
  },
  {
    icon: TrendingUp,
    slug: 'marketing',
    color: 'bg-green-500',
  },
  {
    icon: Users,
    slug: 'consulting',
    color: 'bg-orange-500',
  },
  {
    icon: Calendar,
    slug: 'booking',
    color: 'bg-pink-500',
  },
  {
    icon: CreditCard,
    slug: 'subscription',
    color: 'bg-indigo-500',
  },
];

const features = [
  { icon: Zap, key: 'fast' },
  { icon: Shield, key: 'secure' },
  { icon: Globe, key: 'global' },
  { icon: Star, key: 'quality' },
];

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                Professional Services Platform
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                {t('services.title')}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t('services.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href={`/${locale}/services`}>
                    {t('services.viewAll')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/${locale}/contact`}>
                    {t('footer.contact')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('services.categories')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our comprehensive range of professional services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/${locale}/services?category=${category.slug}`}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}>
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {t(`categories.${category.slug}`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Professional {category.slug} services to help your business grow
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We deliver exceptional quality with every service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">
                    {feature.key === 'fast' && 'Fast Delivery'}
                    {feature.key === 'secure' && 'Secure Payments'}
                    {feature.key === 'global' && 'Global Support'}
                    {feature.key === 'quality' && 'Top Quality'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.key === 'fast' && 'Quick turnaround on all projects'}
                    {feature.key === 'secure' && 'Safe and encrypted transactions'}
                    {feature.key === 'global' && '24/7 support worldwide'}
                    {feature.key === 'quality' && 'Excellence in every delivery'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Tiers Preview */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('services.pricing')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Flexible pricing options for every need
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {['basic', 'standard', 'premium'].map((tier, index) => (
                <Card
                  key={tier}
                  className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="capitalize">{t(`services.${tier}`)}</CardTitle>
                    <CardDescription>
                      {tier === 'basic' && 'For small projects'}
                      {tier === 'standard' && 'Most popular choice'}
                      {tier === 'premium' && 'Full-featured solution'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[1, 2, 3, 4].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Feature {item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6" variant={index === 1 ? 'default' : 'outline'}>
                      {t('services.viewDetails')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join thousands of satisfied clients who have transformed their businesses with our services
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${locale}/services`}>
                  Browse Services
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link href={`/${locale}/auth/register`}>
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
