import { z } from "zod";

export const AddressInputSchema = z.object({
  label: z.string().optional().nullable(),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  region: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().min(1),
  phone: z.string().optional().nullable(),
});

export const CheckoutInputSchema = z.object({
  guestEmail: z.string().email().optional(), // Required if not logged in
  shippingAddress: AddressInputSchema,
  billingAddress: AddressInputSchema.optional().nullable(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "MFS"]),
  mfsPayment: z.object({
    provider: z.enum(["BKASH", "NAGAD", "ROCKET"]),
    senderNumber: z.string(),
    transactionId: z.string(),
  }).optional(),
});

export type AddressInput = z.infer<typeof AddressInputSchema>;
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
