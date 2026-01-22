import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Facebook, Instagram, Youtube, MessageCircle, Mail, ArrowUpRight } from "lucide-react";
import logo from "@/assets/logo.png";

// Custom X (Twitter) icon
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom TikTok icon
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Custom Kwai icon
const KwaiIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5l-3.5-2.1-3.5 2.1.9-4-3.1-2.7 4.1-.4L12 5.5l1.6 3.9 4.1.4-3.1 2.7.9 4z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "Sobre", path: "/sobre" },
      { name: "Como Funciona", path: "/como-funciona" },
      { name: "Blog", path: "/blog" },
      { name: "Contato", path: "/contato" },
    ],
    services: [
      { name: "Para Streamers", path: "/streamers" },
      { name: "Para Empresas", path: "/empresas" },
      { name: "Plataforma", path: "/plataforma" },
      { name: "Lista VIP", path: "/vip" },
    ],
    resources: [
      { name: "Loja", path: "/vendas" },
      { name: "Academy", path: "/academy" },
      { name: "Afiliados", path: "/afiliados" },
      { name: "FAQ", path: "/como-funciona" },
    ],
  };

  const socialLinks = [
    { icon: Youtube, href: "https://youtube.com/@skyagencysc", label: "YouTube" },
    { icon: XIcon, href: "https://x.com/skyagencysc", label: "X", isCustom: true },
    { icon: Instagram, href: "https://www.instagram.com/skyagencysc", label: "Instagram" },
    { icon: Facebook, href: "https://www.facebook.com/skyagencysc/", label: "Facebook" },
    { icon: TikTokIcon, href: "https://www.tiktok.com/@dma010584", label: "TikTok", isCustom: true },
    { icon: KwaiIcon, href: "https://kwai-video.com/u/@DANIELSC/nOjwCLmu", label: "Kwai", isCustom: true },
    { icon: MessageCircle, href: "https://api.whatsapp.com/send/?phone=5548996617935", label: "WhatsApp" },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Glass Background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      
      {/* Gradient orbs */}
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8"
        >
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-2 rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 group-hover:border-primary/30 transition-colors"
              >
                <img src={logo} alt="SKY BRASIL" className="h-8 w-8" />
              </motion.div>
              <span className="text-xl font-bold text-gradient-primary">
                SKY BRASIL
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-sm">
              Transformando Lives em Negócios. Conectamos streamers e marcas para criar parcerias de sucesso.
            </p>
            
            {/* Contact Info - Glass card */}
            <div className="p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-white/10 space-y-2">
              <a 
                href="mailto:skyagencysc@gmail.com" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail size={14} className="text-primary/60" />
                <span>skyagencysc@gmail.com</span>
              </a>
              <a 
                href="mailto:info@skystreamer.online" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail size={14} className="text-primary/60" />
                <span>info@skystreamer.online</span>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Empresa
            </h3>
            <ul className="space-y-1.5">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Serviços
            </h3>
            <ul className="space-y-1.5">
              {footerLinks.services.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              Redes Sociais
            </h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl bg-background/40 backdrop-blur-sm hover:bg-primary/20 border border-white/10 hover:border-primary/30 transition-all duration-200 group"
                  >
                    <Icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>
                );
              })}
            </div>
            
            {/* Resources quick links */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <h4 className="text-xs text-muted-foreground mb-2">Recursos</h4>
              <ul className="space-y-1">
                {footerLinks.resources.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 pt-4 border-t border-white/5"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              © {currentYear} SKY BRASIL — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacidade" className="hover:text-primary transition-colors">
                Privacidade
              </Link>
              <div className="w-px h-3 bg-white/10" />
              <Link to="/termos" className="hover:text-primary transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
