// Payment API Types

export interface PaymentCustomer {
  name: string;
  email: string;
  cpf: string;
  phone_number: string;
}

export interface BillingAddress {
  street: string;
  number: string;
  neighborhood: string;
  zipcode: string;
  city: string;
  complement?: string;
}

export interface PaymentItem {
  name: string;
  value: number;
  amount: number;
}

export interface PaymentRequest {
  payment_token: string;
  customer: PaymentCustomer;
  billing_address: BillingAddress;
  items: PaymentItem[];
}

export interface PaymentResponse {
  success: boolean;
  charge_id?: number;
  status?: string;
  message?: string;
  error?: string;
}

export interface OrderConfirmationRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: PaymentItem[];
  total: number;
}

export interface OrderConfirmationResponse {
  success: boolean;
  message?: string;
  error?: string;
}
