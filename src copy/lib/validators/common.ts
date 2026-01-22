// Common validators and helpers
import { z } from 'zod';

// Regex patterns
export const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const phoneRegex = /^\(?[1-9]{2}\)?\s?(?:9\d{4}|\d{4})-?\d{4}$/;
export const cepRegex = /^\d{5}-?\d{3}$/;
export const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

// CPF validation with check digits
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Sanitize text (remove HTML/JS)
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Common Zod refinements
export const cpfValidator = z.string()
  .refine(isValidCPF, 'CPF inválido');

export const emailValidator = z.string()
  .email('Email inválido')
  .max(255, 'Email deve ter no máximo 255 caracteres')
  .regex(emailRegex, 'Formato de email inválido');

export const phoneValidator = z.string()
  .regex(phoneRegex, 'Telefone inválido. Use formato: (XX) XXXXX-XXXX')
  .transform(val => val.replace(/\D/g, ''));

export const cepValidator = z.string()
  .regex(cepRegex, 'CEP inválido')
  .transform(val => val.replace(/\D/g, ''));

export const sanitizedString = (min: number, max: number, fieldName: string) =>
  z.string()
    .min(min, `${fieldName} deve ter pelo menos ${min} caracteres`)
    .max(max, `${fieldName} deve ter no máximo ${max} caracteres`)
    .transform(sanitizeText);

export const optionalSanitizedString = (max: number, fieldName: string) =>
  z.string()
    .max(max, `${fieldName} deve ter no máximo ${max} caracteres`)
    .optional()
    .transform(val => val ? sanitizeText(val) : val);
