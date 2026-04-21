'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const { locale } = useParams();
  const t = useTranslations();

  const footerLinks = {
    services: [
      { href: `/${locale}/services?category=digital`, label: 'Digital Services' },
      { href: `/${locale}/services?category=ai`, label: 'AI Services' },
      { href: `/${locale}/services?category=marketing`, label: 'Marketing' },
      { href: `/${locale}/services?category=consulting`, label: 'Consulting' },
    ],
    support: [
      { href: `/${locale}/contact`, label: t('footer.contact') },
      { href: `/${locale}/faq`, label: 'FAQ' },
      { href: `/${locale}/help`, label: 'Help Center' },
    ],
    legal: [
      { href: `/${locale}/privacy`, label: t('footer.privacy') },
      { href: `/${locale}/terms`, label: t('footer.terms') },
      { href: `/${locale}/refund`, label: 'Refund Policy' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <span className="font-bold text-xl">{t('common.appName')}</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Professional services marketplace connecting businesses with top talent and service providers.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{t('footer.newsletter')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('footer.subscribeNewsletter')}
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('footer.enterEmail')}
                  className="max-w-[240px]"
                />
                <Button>{t('footer.subscribe')}</Button>
              </div>
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t('common.appName')}. {t('footer.allRightsReserved')}.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{t('footer.followUs')}:</span>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
