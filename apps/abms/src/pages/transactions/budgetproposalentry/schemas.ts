import { z } from 'zod';

const rowSchema = z.object({
    item_name: z.string().min(1, 'Description is required'),
    unit_cost: z.number({ invalid_type_error: 'Unit cost must be a number' }).positive('Unit cost must be greater than 0'),
    quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
    unit_measurement: z.string().min(1, 'Unit of measurement is required'),
    total_cost: z.number({ invalid_type_error: 'Total cost must be a number' }).positive('Total cost must be greater than 0'),
});

export const saveSchema = z.object({
    school_year: z.string().min(1, 'School year is required'),
    user_id: z.string().min(1, 'User is required'),
    department_id: z.string().min(1, 'Department or section must be selected'),
    kind: z.enum(['Department', 'Section']),
    main_account_id: z.number().int().positive('Main account is required'),
    sub_account_id: z.number().int().positive('Sub account is required'),
    existing_ids: z.array(z.number().int()),
    rows: z.array(rowSchema),
});
