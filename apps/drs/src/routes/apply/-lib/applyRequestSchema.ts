import { z } from 'zod';

export const receiveModes = ['email', 'delivery', 'pickup'] as const;

export const applyRequestFormSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email'),
    contactNumber: z.string().trim().min(7, 'Contact number is too short'),
    receiveMode: z.enum(receiveModes),
    deliveryAddress: z.string().optional(),
    purpose: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.receiveMode === 'delivery') {
      const addr = data.deliveryAddress?.trim() ?? '';
      if (addr.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a delivery address (at least 8 characters).',
          path: ['deliveryAddress'],
        });
      }
    }
  });

export type ApplyRequestFormValues = z.infer<typeof applyRequestFormSchema>;

export const applyRequestFormDefaults: ApplyRequestFormValues = {
  email: '',
  contactNumber: '',
  receiveMode: 'pickup',
  deliveryAddress: '',
  purpose: '',
};
