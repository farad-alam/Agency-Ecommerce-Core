import { z } from "zod";

export const UpdateInventoryInputSchema = z.object({
  updates: z.array(
    z.object({
      variantId: z.string(),
      inventoryQty: z.number().int().min(0),
    })
  ),
});

export type UpdateInventoryInput = z.infer<typeof UpdateInventoryInputSchema>;

export type InventoryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
};
