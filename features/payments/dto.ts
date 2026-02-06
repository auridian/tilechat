import { z } from "zod";

export const CreateInvoiceRequest = z.object({
  recipientAddress: z.string().min(1),
  amount: z.string().min(1),
  token: z.string().min(1),
  network: z.string().min(1),
  productId: z.string().min(1),
});

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequest>;

export const CreateInvoiceResponse = z.object({
  invoice: z.string(),
  id: z.string(),
});

export type CreateInvoiceResponse = z.infer<typeof CreateInvoiceResponse>;

export const WebhookPayload = z.object({
  invoice: z.string(),
  recipient: z.string(),
  txHash: z.string().optional(),
  status: z.enum(["finalized", "failed"]),
  amount: z.union([z.string(), z.number()]).transform(String).optional(),
  token: z.string().optional(),
  network: z.string().optional(),
  test: z.boolean().optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayload>;

export const TransactionDTO = z.object({
  id: z.string(),
  txHash: z.string().nullable(),
  status: z.string(),
  amount: z.string().nullable(),
  token: z.string().nullable(),
  invoice: z.string().nullable(),
  test: z.string().nullable(),
  createdAt: z.string(),
});

export type TransactionDTO = z.infer<typeof TransactionDTO>;
