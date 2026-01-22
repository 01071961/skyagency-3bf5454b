import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "./CartSheet";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Sobre Nós", path: "/sobre" },
    { name: "Para Streamers", path: "/streamers" },
    { name: "Para Empresas", path: "/empresas" },
    { name: "Como Funciona", path: "/como-funciona" },
    { name: "Plataforma", path: "/plataforma" },
    { name: "Vendas", path: "/vendas" },
    { name: "Blog", path: "/blog" },
    { name: "Contato", path: "/contato" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SKY BRASIL" className="h-10 w-10 animate-glow-pulse" />
            <span className="text-2xl font-bold text-gradient-primary hidden sm:inline">
              SKY BRASIL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
            <CartSheet />
            <Button variant="hero" size="lg" asChild>
              <Link to="/vip">Entrar na Lista VIP</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <CartSheet />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 animate-fade-in-down">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth py-2"
                >
                  {link.name}
                </Link>
              ))}
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to="/vip" onClick={() => setIsOpen(false)}>
                  Entrar na Lista VIP
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
