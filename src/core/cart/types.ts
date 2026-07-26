import { z } from "zod";

export const CartItemInputSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1),
});

export const UpdateCartItemInputSchema = z.object({
  quantity: z.number().int().min(0), // 0 means remove
});

export type CartItemInput = z.infer<typeof CartItemInputSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>;
