import { LeadFormBlock } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Phone, Lock } from 'lucide-react';

interface LeadFormBlockRendererProps {
  block: LeadFormBlock;
  isPreview?: boolean;
}

const FIELD_ICONS = {
  name: User,
  email: Mail,
  phone: Phone,
  whatsapp: Phone,
};

const FIELD_LABELS = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
};

const FIELD_PLACEHOLDERS = {
  name: 'Seu nome completo',
  email: 'seu@email.com',
  phone: '(00) 00000-0000',
  whatsapp: '(00) 00000-0000',
};

export const LeadFormBlockRenderer = ({ block, isPreview = true }: LeadFormBlockRendererProps) => {
  const { content } = block;

  const buttonClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    glow: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  };

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {content.title && (
            <h3 className="text-2xl font-bold text-center mb-2">{content.title}</h3>
          )}
          {content.subtitle && (
            <p className="text-muted-foreground text-center mb-6">{content.subtitle}</p>
          )}

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {content.fields.map((field) => {
              const Icon = FIELD_ICONS[field];
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{FIELD_LABELS[field]}</Label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={field}
                      type={field === 'email' ? 'email' : field === 'phone' || field === 'whatsapp' ? 'tel' : 'text'}
                      placeholder={FIELD_PLACEHOLDERS[field]}
                      className="pl-10"
                      disabled={isPreview}
                    />
                  </div>
                </div>
              );
            })}

            <Button
              type="submit"
              className={`w-full h-12 text-lg font-semibold ${buttonClasses[content.buttonStyle]}`}
              disabled={isPreview}
            >
              {content.buttonText}
            </Button>

            {content.showPrivacyNote && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Seus dados estão seguros. Não enviamos spam.
              </p>
            )}
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Integração: <span className="font-medium capitalize">{content.integration}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
