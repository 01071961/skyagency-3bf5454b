import { z } from 'zod';

// Regex para email RFC 5322 simplificado
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validação de CPF com dígitos verificadores
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Validação de telefone brasileiro
const phoneRegex = /^\(?[1-9]{2}\)?\s?(?:9\d{4}|\d{4})-?\d{4}$/;

// Remove tags HTML/JS
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Schema para formulário de contato
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .regex(emailRegex, 'Formato de email inválido'),
  userType: z.string()
    .max(50, 'Tipo deve ter no máximo 50 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  message: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(2000, 'Mensagem deve ter no máximo 2000 caracteres')
    .transform(sanitizeText),
  source: z.enum(['contact', 'vip']),
  channel: z.string()
    .max(100, 'Canal deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  platform: z.string()
    .max(50, 'Plataforma deve ter no máximo 50 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  followers: z.string()
    .max(20, 'Seguidores deve ter no máximo 20 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
});

// Schema para checkout/pagamento
export const checkoutSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .regex(emailRegex, 'Formato de email inválido'),
  phone: z.string()
    .regex(phoneRegex, 'Telefone inválido. Use formato: (XX) XXXXX-XXXX')
    .transform(val => val.replace(/\D/g, '')),
  cpf: z.string()
    .refine(isValidCPF, 'CPF inválido'),
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .transform(val => val.replace(/\D/g, '')),
  street: z.string()
    .min(2, 'Rua obrigatória')
    .max(200, 'Rua deve ter no máximo 200 caracteres')
    .transform(sanitizeText),
  number: z.string()
    .min(1, 'Número obrigatório')
    .max(20, 'Número deve ter no máximo 20 caracteres')
    .transform(sanitizeText),
  complement: z.string()
    .max(100, 'Complemento deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  neighborhood: z.string()
    .min(2, 'Bairro obrigatório')
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  city: z.string()
    .min(2, 'Cidade obrigatória')
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  cardNumber: z.string()
    .regex(/^\d{13,19}$|^\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}$/, 'Número do cartão inválido')
    .transform(val => val.replace(/\s/g, '')),
  cardName: z.string()
    .min(2, 'Nome no cartão obrigatório')
    .max(100, 'Nome no cartão deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  expiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Validade inválida. Use formato: MM/AA'),
  cvv: z.string()
    .regex(/^\d{3,4}$/, 'CVV inválido'),
});

// Schema para validação no backend (edge function)
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

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CheckoutData = z.infer<typeof checkoutSchema>;
export type PaymentRequestData = z.infer<typeof paymentRequestSchema>;
