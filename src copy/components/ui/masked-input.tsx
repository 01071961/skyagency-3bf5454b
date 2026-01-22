import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

type MaskType = 'cpf' | 'cnpj' | 'cep' | 'phone' | 'none';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

const masks: Record<MaskType, (value: string) => string> = {
  cpf: (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14);
  },
  cnpj: (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  },
  cep: (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  },
  phone: (value: string) => {
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
  },
  none: (value: string) => value,
};

const maxLengths: Record<MaskType, number> = {
  cpf: 14,
  cnpj: 18,
  cep: 9,
  phone: 15,
  none: 999,
};

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = masks[mask](e.target.value);
      onChange(maskedValue);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        maxLength={maxLengths[mask]}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

export default MaskedInput;
