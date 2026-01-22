import { useState, useEffect } from "react";
import { z } from "zod";
import InputMask from "react-input-mask";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, User, Mail, Phone, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  phone: z.string().min(14, "Telefone inválido"),
  subject: z.string().min(1, "Selecione um assunto"),
  state: z.string().min(1, "Selecione seu estado"),
});

export type PreChatFormData = z.infer<typeof formSchema>;

interface PreChatFormProps {
  onSubmit: (data: PreChatFormData) => void;
  onPartialChange?: (data: Partial<PreChatFormData>) => void;
  isSubmitting?: boolean;
}

const SUBJECTS = [
  "Parcerias para Streamers",
  "Parcerias para Marcas",
  "Suporte Técnico",
  "Informações sobre a Plataforma",
  "Lista VIP",
  "Outros",
];

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', region: 'Norte' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', region: 'Norte' },
  { code: 'RR', name: 'Roraima', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', region: 'Norte' },
];

export const PreChatForm = ({ onSubmit, onPartialChange, isSubmitting }: PreChatFormProps) => {
  const [formData, setFormData] = useState<Partial<PreChatFormData>>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    state: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track partial form data for abandonment detection
  useEffect(() => {
    if (onPartialChange) {
      const hasAnyData = Object.values(formData).some(v => v && v.length > 0);
      if (hasAnyData) {
        onPartialChange(formData);
      }
    }
  }, [formData, onPartialChange]);

  const handleChange = (field: keyof PreChatFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    onSubmit(result.data);
  };

  const inputVariants = {
    focus: { scale: 1.01, transition: { duration: 0.2 } },
    blur: { scale: 1 }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      {/* Header with glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5 pb-4 border-b border-white/10"
      >
        <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bem-vindo ao Chat SKY BRASIL
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para iniciar</p>
      </motion.div>

      {/* Name Field */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
          <User className="h-3.5 w-3.5 text-primary" />
          Nome
        </Label>
        <motion.div whileFocus="focus" variants={inputVariants}>
          <Input
            id="name"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={e => handleChange("name", e.target.value)}
            className={`bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.name ? "border-destructive" : ""}`}
          />
        </motion.div>
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </motion.div>

      {/* Email Field */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-3.5 w-3.5 text-primary" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={e => handleChange("email", e.target.value)}
          className={`bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.email ? "border-destructive" : ""}`}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </motion.div>

      {/* Phone Field */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-3.5 w-3.5 text-primary" />
          Telefone
        </Label>
        <InputMask
          mask="+55 (99) 99999-9999"
          value={formData.phone}
          onChange={e => handleChange("phone", e.target.value)}
        >
          {(inputProps: any) => (
            <Input
              {...inputProps}
              id="phone"
              placeholder="+55 (00) 00000-0000"
              className={`bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.phone ? "border-destructive" : ""}`}
            />
          )}
        </InputMask>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </motion.div>

      {/* State Field - NEW */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        <Label htmlFor="state" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Estado
        </Label>
        <Select
          value={formData.state}
          onValueChange={value => handleChange("state", value)}
        >
          <SelectTrigger className={`bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.state ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Selecione seu estado" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {BRAZILIAN_STATES.map(state => (
              <SelectItem key={state.code} value={state.code}>
                {state.code} - {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
      </motion.div>

      {/* Subject Field */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          Assunto
        </Label>
        <Select
          value={formData.subject}
          onValueChange={value => handleChange("subject", value)}
        >
          <SelectTrigger className={`bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.subject ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Selecione um assunto" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/20" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : (
            "Iniciar Conversa"
          )}
        </Button>
      </motion.div>
    </form>
  );
};