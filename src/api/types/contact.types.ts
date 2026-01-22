// Contact API Types

export type ContactSource = 'contact' | 'vip';

export interface ContactRequest {
  name: string;
  email: string;
  userType?: string;
  message: string;
  source: ContactSource;
  // VIP specific fields
  channel?: string;
  platform?: string;
  followers?: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  submissionId?: string;
  error?: string;
}
