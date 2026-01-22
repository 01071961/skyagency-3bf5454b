import { motion } from 'framer-motion';
import { Award, CheckCircle, Download, Share2, ExternalLink, QrCode, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface CertificateCardProps {
  certificate: {
    id: string;
    certificate_number: string;
    validation_code: string;
    course_name: string;
    student_name: string;
    course_hours: number | null;
    final_score: number | null;
    issued_at: string;
    product_id: string;
  };
  variant?: 'default' | 'compact' | 'pending';
}

export function CertificateCard({ certificate, variant = 'default' }: CertificateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/${certificate.validation_code}`;
    if (navigator.share) {
      navigator.share({
        title: `Certificado - ${certificate.course_name}`,
        text: `🎓 Concluí o curso "${certificate.course_name}" e recebi meu certificado!`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link de verificação copiado!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden group hover:shadow-[var(--glow-primary)] transition-all duration-300 bg-gradient-to-br from-card to-card/80 border-border/50">
        {/* Certificate Preview - Premium Design */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10" />
          <div className="absolute inset-0 bg-[var(--gradient-mesh)] opacity-50" />
          
          {/* Decorative Elements */}
          <motion.div 
            className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-secondary/40 rounded-tr-xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-secondary/40 rounded-bl-xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-[var(--glow-accent)]"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Award className="h-10 w-10 text-white" />
            </motion.div>
            
            <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-2 font-medium">
              Certificado de Conclusão
            </p>
            <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {certificate.course_name}
            </h3>
            
            <div className="flex items-center gap-3 mt-4">
              {certificate.course_hours && (
                <Badge variant="secondary" className="bg-muted/80 backdrop-blur gap-1">
                  <Clock className="h-3 w-3" />
                  {certificate.course_hours}h
                </Badge>
              )}
              {certificate.final_score && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                  {certificate.final_score}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Verified Badge */}
          <motion.div 
            className="absolute top-3 right-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Badge className="bg-green-500/90 text-white gap-1 shadow-lg">
              <CheckCircle className="h-3 w-3" />
              Verificado
            </Badge>
          </motion.div>
        </div>

        <CardContent className="p-4 space-y-4 bg-card/50 backdrop-blur">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Emitido em</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {formatDate(certificate.issued_at)}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Código</span>
              <div className="flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-secondary" />
                <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                  {certificate.validation_code.slice(0, 8)}
                </code>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/members/certificate/${certificate.product_id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary gap-2" size="sm">
                <ExternalLink className="h-4 w-4" />
                Ver Certificado
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="hover:bg-secondary/10 hover:border-secondary/50"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
