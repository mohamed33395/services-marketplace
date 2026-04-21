import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'ar']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const serviceSchema = z.object({
  categoryId: z.string().cuid(),
  subcategoryId: z.string().cuid().optional(),
  nameEn: z.string().min(3),
  nameAr: z.string().min(3),
  shortDescEn: z.string().min(10).max(300),
  shortDescAr: z.string().min(10).max(300),
  descriptionEn: z.string().min(50),
  descriptionAr: z.string().min(50),
  featuresEn: z.array(z.string()),
  featuresAr: z.array(z.string()),
  type: z.enum(['DIGITAL', 'AI', 'MARKETING', 'CONSULTING', 'BOOKING', 'SUBSCRIPTION', 'CUSTOM']),
  image: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  hasBooking: z.boolean().default(false),
  hasSubscription: z.boolean().default(false),
  hasCustomQuote: z.boolean().default(false),
});

export const pricingTierSchema = z.object({
  serviceId: z.string().cuid(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  nameEn: z.string().min(2),
  nameAr: z.string().min(2),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().positive(),
  deliveryDays: z.number().int().positive(),
  revisions: z.number().int().min(0),
  featuresEn: z.array(z.string()),
  featuresAr: z.array(z.string()),
  isActive: z.boolean().default(true),
});

export const orderSchema = z.object({
  serviceId: z.string().cuid(),
  pricingTierId: z.string().cuid().optional(),
  requirements: z.string().min(10),
  addOnIds: z.array(z.string().cuid()).optional(),
});

export const bookingSchema = z.object({
  serviceId: z.string().cuid(),
  date: z.string().datetime(),
  timeSlotId: z.string().cuid().optional(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

export const quoteRequestSchema = z.object({
  serviceId: z.string().cuid(),
  requirements: z.string().min(20),
  budget: z.number().positive().optional(),
  timeline: z.string().optional(),
});

export const quoteSchema = z.object({
  serviceId: z.string().cuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.string().optional(),
});

export const ticketMessageSchema = z.object({
  ticketId: z.string().cuid(),
  content: z.string().min(1),
  files: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
  isInternal: z.boolean().default(false),
});

export const customerNoteSchema = z.object({
  customerId: z.string().cuid(),
  content: z.string().min(1),
  isInternal: z.boolean().default(true),
});

export const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'PAID_ADS', 'EMAIL', 'OTHER']),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  orderId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(1000).optional(),
});

export const categorySchema = z.object({
  slug: z.string().min(2).max(50),
  nameEn: z.string().min(2),
  nameAr: z.string().min(2),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const subcategorySchema = z.object({
  categoryId: z.string().cuid(),
  slug: z.string().min(2).max(50),
  nameEn: z.string().min(2),
  nameAr: z.string().min(2),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type PricingTierInput = z.infer<typeof pricingTierSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SubcategoryInput = z.infer<typeof subcategorySchema>;
