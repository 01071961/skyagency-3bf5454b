import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, MessageCircle, Send } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.userType || !formData.message) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    // Simulate form submission
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", userType: "", message: "" });
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Entre em <span className="text-gradient-primary">Contato</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Tem dúvidas ou quer saber mais sobre nossas soluções? Envie uma mensagem
            e nossa equipe responderá em breve.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userType">Tipo de Pessoa</Label>
                    <Select
                      value={formData.userType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, userType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="streamer">Streamer</SelectItem>
                        <SelectItem value="marca">Marca / Empresa</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Conte-nos o que você precisa..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    <Send size={16} />
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-primary p-8 border-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Email Direto
                  </h3>
                  <p className="text-white/90 mb-3">
                    Prefere enviar um email direto? Sem problemas!
                  </p>
                  <a
                    href="mailto:contato@skybrasil.com.br"
                    className="text-white font-semibold hover:underline"
                  >
                    contato@skybrasil.com.br
                  </a>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-secondary p-8 border-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Redes Sociais
                  </h3>
                  <p className="text-white/90 mb-3">
                    Siga-nos e fique por dentro das novidades
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="#"
                      className="text-white hover:text-white/80 transition-smooth font-semibold"
                    >
                      Instagram
                    </a>
                    <span className="text-white/50">•</span>
                    <a
                      href="#"
                      className="text-white hover:text-white/80 transition-smooth font-semibold"
                    >
                      Twitter
                    </a>
                    <span className="text-white/50">•</span>
                    <a
                      href="#"
                      className="text-white hover:text-white/80 transition-smooth font-semibold"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border p-8">
              <h3 className="text-xl font-bold mb-3">Horário de Atendimento</h3>
              <p className="text-muted-foreground mb-4">
                Nossa equipe está disponível para responder suas dúvidas:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Segunda a Sexta:</span> 9h às 18h
                </p>
                <p>
                  <span className="font-semibold">Sábado:</span> 9h às 13h
                </p>
                <p className="text-muted-foreground">
                  * Respondemos todos os emails em até 24h úteis
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
