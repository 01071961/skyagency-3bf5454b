// Company Settings Validation Schema
import { z } from 'zod';
import { emailRegex, sanitizeText, isValidCPF } from './common';

// CNPJ validation with check digits
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // First check digit
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Second check digit
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

// Phone regex (Brazilian format) - specific for company schema
const companyPhoneRegex = /^\(?[1-9]{2}\)?\s?(?:9\d{4}|\d{4})-?\d{4}$/;

// CEP regex - specific for company schema
const companyCepRegex = /^\d{5}-?\d{3}$/;

// CNPJ regex
const cnpjRegex = /^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// URL regex
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Company settings schema
export const companySettingsSchema = z.object({
  company_name: z.string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(200, 'Nome da empresa deve ter no máximo 200 caracteres')
    .transform(sanitizeText),
  
  legal_name: z.string()
    .max(200, 'Razão social deve ter no máximo 200 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  cnpj: z.string()
    .optional()
    .refine(val => !val || val === '' || isValidCNPJ(val), 'CNPJ inválido'),
  
  address_street: z.string()
    .max(200, 'Rua deve ter no máximo 200 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  address_number: z.string()
    .max(20, 'Número deve ter no máximo 20 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  address_complement: z.string()
    .max(100, 'Complemento deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  address_neighborhood: z.string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  address_city: z.string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  address_state: z.string()
    .max(2, 'Estado deve ter 2 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val).toUpperCase() : val),
  
  address_zip: z.string()
    .optional()
    .refine(val => !val || val === '' || companyCepRegex.test(val), 'CEP inválido'),
  
  address_country: z.string()
    .max(50, 'País deve ter no máximo 50 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  phone: z.string()
    .optional()
    .refine(val => !val || val === '' || companyPhoneRegex.test(val.replace(/\D/g, '').length >= 10 ? val : ''), 'Telefone inválido'),
  
  email: z.string()
    .optional()
    .refine(val => !val || val === '' || emailRegex.test(val), 'Email inválido'),
  
  website: z.string()
    .max(200, 'Website deve ter no máximo 200 caracteres')
    .optional(),
  
  legal_representative_name: z.string()
    .max(200, 'Nome do representante deve ter no máximo 200 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  legal_representative_cpf: z.string()
    .optional()
    .refine(val => !val || val === '' || isValidCPF(val), 'CPF inválido'),
  
  legal_representative_role: z.string()
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  academic_coordinator_name: z.string()
    .max(200, 'Nome do coordenador deve ter no máximo 200 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  academic_coordinator_role: z.string()
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  certificate_template: z.enum(['modern', 'classic', 'minimal']).optional(),
  
  certificate_footer_text: z.string()
    .max(500, 'Texto do rodapé deve ter no máximo 500 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  
  primary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor primária inválida')
    .optional(),
  
  secondary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária inválida')
    .optional(),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

// Format CNPJ with mask
export function formatCNPJ(value: string): string {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

// Format CEP with mask
export function formatCEP(value: string): string {
  const clean = value.replace(/\D/g, '');
  return clean.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

// Format phone with mask
export function formatPhone(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return clean
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

// Format CPF with mask
export function formatCPF(value: string): string {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .slice(0, 14);
}
