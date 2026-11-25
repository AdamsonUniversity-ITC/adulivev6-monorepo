import { z } from 'zod';
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_DIAL_CODE,
  dialForCountryCode,
  validateNationalNumber,
} from '../../-lib/contact-number.ts';

export const receiveModes = ['delivery', 'pickup'] as const;

export const applyRequestFormSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email'),
    contactCountryCode: z.string().trim().min(2),
    contactNationalNumber: z
      .string()
      .trim()
      .min(1, 'Contact number is required'),
    receiveMode: z.enum(receiveModes),
    paymentMethodId: z.string().trim().min(1, 'Select a mode of payment'),
    secureEmail: z.boolean(),
    deliveryAddress: z.string().optional(),
    purpose: z.string().trim().min(1, 'Purpose is required').max(2000),
  })
  .superRefine((data, ctx) => {
    const dial = dialForCountryCode(
      data.contactCountryCode || DEFAULT_COUNTRY_CODE,
    );
    const phoneError = validateNationalNumber(
      dial || DEFAULT_DIAL_CODE,
      data.contactNationalNumber,
    );
    if (phoneError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: phoneError,
        path: ['contactNationalNumber'],
      });
    }
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
  contactCountryCode: DEFAULT_COUNTRY_CODE,
  contactNationalNumber: '',
  receiveMode: 'pickup',
  paymentMethodId: '',
  secureEmail: false,
  deliveryAddress: '',
  purpose: '',
};
