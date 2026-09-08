import { z } from 'zod';

export const createPaymentSessionSchema = z.object({
  orderId: z.string().min(1),
});
