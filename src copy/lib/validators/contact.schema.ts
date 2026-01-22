// Contact form validation schema
import { z } from 'zod';
import { emailValidator, sanitizedString, optionalSanitizedString } from './common';

export const contactFormSchema = z.object({
  name: sanitizedString(2, 100, 'Nome'),
  email: emailValidator,
  userType: optionalSanitizedString(50, 'Tipo'),
  message: sanitizedString(10, 2000, 'Mensagem'),
  source: z.enum(['contact', 'vip']),
  channel: optionalSanitizedString(100, 'Canal'),
  platform: optionalSanitizedString(50, 'Plataforma'),
  followers: optionalSanitizedString(20, 'Seguidores'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
