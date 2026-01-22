// Checkout form validation schema
import { z } from 'zod';
import { 
  emailValidator, 
  phoneValidator, 
  cepValidator, 
  cpfValidator,
  sanitizedString,
  optionalSanitizedString 
} from './common';

export const checkoutSchema = z.object({
  name: sanitizedString(2, 100, 'Nome'),
  email: emailValidator,
  phone: phoneValidator,
  cpf: cpfValidator,
  cep: cepValidator,
  street: sanitizedString(2, 200, 'Rua'),
  number: sanitizedString(1, 20, 'Número'),
  complement: optionalSanitizedString(100, 'Complemento'),
  neighborhood: sanitizedString(2, 100, 'Bairro'),
  city: sanitizedString(2, 100, 'Cidade'),
  cardNumber: z.string()
    .regex(/^\d{13,19}$|^\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}$/, 'Número do cartão inválido')
    .transform(val => val.replace(/\s/g, '')),
  cardName: sanitizedString(2, 100, 'Nome no cartão'),
  expiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Validade inválida. Use formato: MM/AA'),
  cvv: z.string()
    .regex(/^\d{3,4}$/, 'CVV inválido'),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
