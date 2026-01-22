// Payment request validation schema (for backend use)
import { z } from 'zod';
import { isValidCPF, sanitizeText } from './common';

export const paymentRequestSchema = z.object({
  payment_token: z.string().min(1, 'Token de pagamento obrigatório'),
  customer: z.object({
    name: z.string().min(2).max(100).transform(sanitizeText),
    email: z.string().email().max(255),
    cpf: z.string().refine(val => isValidCPF(val.replace(/\D/g, '')), 'CPF inválido'),
    phone_number: z.string().min(10).max(15).transform(val => val.replace(/\D/g, '')),
  }),
  billing_address: z.object({
    street: z.string().min(2).max(200).transform(sanitizeText),
    number: z.string().min(1).max(20).transform(sanitizeText),
    neighborhood: z.string().min(2).max(100).transform(sanitizeText),
    zipcode: z.string().regex(/^\d{8}$/),
    city: z.string().min(2).max(100).transform(sanitizeText),
    complement: z.string().max(100).optional().transform(val => val ? sanitizeText(val) : ''),
  }),
  items: z.array(z.object({
    name: z.string().min(1).max(200).transform(sanitizeText),
    value: z.number().positive(),
    amount: z.number().int().positive(),
  })).min(1, 'Pelo menos um item é obrigatório'),
});

export type PaymentRequestData = z.infer<typeof paymentRequestSchema>;
