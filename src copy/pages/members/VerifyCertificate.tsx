import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  BookOpen,
  Shield,
  Home
} from 'lucide-react';

interface CertificateData {
  id: string;
  certificate_number: string;
  validation_code: string;
  student_name: string;
  course_name: string;
  course_hours: number;
  final_score: number | null;
  issued_at: string;
}

const VerifyCertificate = () => {
  const { code } = useParams<{ code: string }>();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      verifyCertificate();
    }
  }, [code]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('validation_code', code?.toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Certificado não encontrado. Verifique o código e tente novamente.');
      } else {
        setCertificate(data);
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('Erro ao verificar certificado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando certificado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">SKY Brasil Academy</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Página Inicial
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {error ? (
            <Card className="border-destructive/50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Certificado Não Encontrado</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex justify-center gap-3">
                  <Link to="/">
                    <Button variant="outline">Voltar ao Início</Button>
                  </Link>
                  <Button onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : certificate && (
            <Card className="border-green-500/50 overflow-hidden">
              {/* Success banner */}
              <div className="bg-green-500 text-white py-4 px-6">
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-6 h-6" />
                  <span className="font-semibold">Certificado Válido e Autêntico</span>
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <CardContent className="p-8">
                {/* Certificate icon */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-12 h-12 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Certificado de Conclusão</h1>
                  <p className="text-muted-foreground mt-1">
                    Este certificado é válido e foi emitido pela SKY Brasil Academy
                  </p>
                </div>

                {/* Certificate details */}
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Aluno(a)</span>
                    </div>
                    <p className="text-xl font-semibold">{certificate.student_name}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Curso</span>
                    </div>
                    <p className="text-xl font-semibold">{certificate.course_name}</p>
                    {certificate.course_hours > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Carga horária: {certificate.course_hours} horas
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Emitido em</span>
                      </div>
                      <p className="font-semibold">{formatDate(certificate.issued_at)}</p>
                    </div>

                    {certificate.final_score !== null && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">Nota Final</span>
                        </div>
                        <p className="font-semibold">{certificate.final_score}%</p>
                      </div>
                    )}
                  </div>

                  {/* Verification codes */}
                  <div className="border-t pt-6 mt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Código de Verificação</p>
                        <Badge variant="outline" className="text-lg font-mono px-4 py-1">
                          {certificate.validation_code}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Número do Certificado</p>
                        <Badge variant="secondary" className="text-sm font-mono px-4 py-1">
                          {certificate.certificate_number}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="mt-8 pt-6 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    Este certificado pode ser verificado a qualquer momento através do código acima.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    SKY Brasil Academy • Plataforma de Educação Digital
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyCertificate;
