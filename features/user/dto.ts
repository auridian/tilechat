import { z } from "zod";

/** API response shape for a user (dates serialized as ISO strings) */
export const UserDTO = z.object({
  id: z.string(),
  alienId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserDTO = z.infer<typeof UserDTO>;

/** Standard API error response */
export const ApiErrorDTO = z.object({
  error: z.string(),
});

export type ApiErrorDTO = z.infer<typeof ApiErrorDTO>;
