import { z } from "zod";
import { ReviewStatus } from "@prisma/client";

export const CreateReviewInputSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().optional(),
});

export const UpdateReviewStatusInputSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
export type UpdateReviewStatusInput = z.infer<typeof UpdateReviewStatusInputSchema>;

export type ReviewQueryParams = {
  page?: number;
  limit?: number;
  productId?: string;
  status?: string;
};
