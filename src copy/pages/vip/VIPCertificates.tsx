'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Award, Download, ExternalLink, Calendar, 
  BookOpen, Trophy, Share2, Copy, CheckCircle
} from 'lucide-react';
import { downloadCertificatePDF } from '@/lib/pdf/certificatePdfGenerator';

interface Certificate {
  id: string;
  certificate_number: string;
  validation_code: string;
  student_name: string;
  course_name: string;
  course_hours: number;
  final_score: number | null;
  issued_at: string;
  product_id: string;
}

interface GeneratedCertificate {
  id: string;
  user_id: string;
  product_id: string;
  pdf_url: string | null;
  status: string;
  generated_at: string | null;
}

export default function VIPCertificates() {
  const { user } = useAuth();

  // Fetch course_certificates (official records)
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['vip-certificates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!user?.id
  });

  // Fetch generated_certificates (PDF URLs)
  const { data: generatedCerts } = useQuery({
    queryKey: ['generated-certificates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_certificates')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data as GeneratedCertificate[];
    },
    enabled: !!user?.id
  });

  // Fetch company settings for PDF generation
  const { data: company } = useQuery({
    queryKey: ['company-settings-cert'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const getGeneratedCert = (productId: string) => {
    return generatedCerts?.find(g => g.product_id === productId);
  };

  const handleDownload = async (cert: Certificate) => {
    const generated = getGeneratedCert(cert.product_id);
    
    if (generated?.pdf_url) {
      // Download from storage
      try {
        const response = await fetch(generated.pdf_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-${cert.validation_code}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Download iniciado!');
      } catch (error) {
        console.error('Download error:', error);
        // Fallback: generate new PDF
        await downloadCertificatePDF(cert, company);
        toast.success('PDF gerado e baixado!');
      }
    } else {
      // Generate PDF on the fly
      await downloadCertificatePDF(cert, company);
      toast.success('PDF gerado e baixado!');
    }
  };

  const handleCopyValidationLink = (code: string) => {
    const url = `${window.location.origin}/verificar-certificado/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de validação copiado!');
  };

  const handleShareLinkedIn = (cert: Certificate) => {
    const text = `🎓 Acabei de concluir o curso "${cert.course_name}" na SKY Brasil Academy! 

📊 Aproveitamento: ${cert.final_score || 100}%
📚 Carga Horária: ${cert.course_hours}h

Verifique meu certificado: ${window.location.origin}/verificar-certificado/${cert.validation_code}

#Educação #Certificação #SKYBrasil`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      `${window.location.origin}/verificar-certificado/${cert.validation_code}`
    )}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=600');
    toast.success('Abrindo LinkedIn para compartilhar...');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Certificados</h1>
          <p className="text-muted-foreground">Carregando seus certificados...</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!certificates?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Award className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Nenhum Certificado Ainda</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Complete seus cursos e simulados para receber seus certificados de conclusão.
        </p>
        <Button asChild>
          <a href="/vip/my-products">Ver Meus Cursos</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-primary" />
            Meus Certificados
          </h1>
          <p className="text-muted-foreground">
            {certificates.length} certificado{certificates.length !== 1 ? 's' : ''} emitido{certificates.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => {
          const generated = getGeneratedCert(cert.product_id);
          const hasStoredPdf = !!generated?.pdf_url;

          return (
            <Card key={cert.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Decorative header */}
              <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{cert.course_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cert.issued_at)}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Válido
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {cert.final_score !== null && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nota</p>
                        <p className="font-semibold">{cert.final_score}%</p>
                      </div>
                    </div>
                  )}
                  {cert.course_hours > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Carga</p>
                        <p className="font-semibold">{cert.course_hours}h</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificate codes */}
                <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nº:</span>
                    <code className="font-mono text-xs">{cert.certificate_number}</code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Código:</span>
                    <code className="font-mono text-xs font-semibold text-primary">{cert.validation_code}</code>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    onClick={() => handleDownload(cert)}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleShareLinkedIn(cert)}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopyValidationLink(cert.validation_code)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar Link
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    asChild
                  >
                    <a 
                      href={`/verificar-certificado/${cert.validation_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Verificar
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
