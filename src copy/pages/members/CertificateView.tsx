import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Award, 
  Download, 
  Share2, 
  ChevronLeft,
  Printer,
  Shield,
  Loader2,
  CheckCircle,
  Copy,
  RefreshCw,
  Linkedin
} from 'lucide-react';
import LinkedInShareButton from '@/components/certificates/LinkedInShareButton';
import { toast } from 'sonner';
import { 
  checkCertificateEligibility, 
  generateCertificate, 
  getCertificateByProduct 
} from '@/components/certificates/CertificateGenerator';
import { cn } from '@/lib/utils';
import { useRealtimeCompanySettings } from '@/hooks/useRealtimeCompanySettings';

interface Course {
  name: string;
  description: string | null;
}

interface Profile {
  name: string | null;
  email: string;
}

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

const CertificateView = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason?: string; quizScores?: number[] } | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [studentName, setStudentName] = useState('');
  
  // Use realtime company settings
  const { settings: companySettings, loading: settingsLoading, refresh: refreshSettings } = useRealtimeCompanySettings();

  useEffect(() => {
    if (productId && user) {
      fetchData();
    }
  }, [productId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('products')
        .select('name, description')
        .eq('id', productId)
        .maybeSingle();

      if (courseError) {
        console.error('Error fetching course:', courseError);
      }
      setCourse(courseData);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError || !profileData) {
        setProfile({ name: user?.user_metadata?.name || null, email: user?.email || '' });
      } else {
        setProfile(profileData);
      }

      // Check for existing certificate
      const existingCert = await getCertificateByProduct(user!.id, productId!);
      if (existingCert) {
        setCertificate(existingCert as CertificateData);
        return;
      }

      // Check eligibility
      const eligibilityResult = await checkCertificateEligibility(user!.id, productId!);
      setEligibility(eligibilityResult);

      // Set default student name
      setStudentName(profileData?.name || user?.user_metadata?.name || '');

    } catch (error) {
      console.error('Error fetching certificate data:', error);
      toast.error('Erro ao carregar certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!studentName.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    setGenerating(true);
    setShowNameDialog(false);

    try {
      // Calculate final score from quiz scores
      let finalScore: number | undefined;
      if (eligibility?.quizScores && eligibility.quizScores.length > 0) {
        finalScore = Math.round(
          eligibility.quizScores.reduce((a, b) => a + b, 0) / eligibility.quizScores.length
        );
      }

      const result = await generateCertificate({
        userId: user!.id,
        productId: productId!,
        studentName: studentName.trim(),
        courseName: course?.name || 'Curso',
        courseHours: 40, // Can be calculated from lessons
        finalScore,
        sendEmail: true,
        recipientEmail: profile?.email || user?.email
      });

      if (result.success) {
        // Refetch certificate
        const cert = await getCertificateByProduct(user!.id, productId!);
        if (cert) {
          setCertificate(cert as CertificateData);
        }
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = certificate 
      ? `${window.location.origin}/verificar-certificado/${certificate.validation_code}`
      : window.location.href;

    if (navigator.share) {
      navigator.share({
        title: `Certificado - ${course?.name}`,
        text: `Concluí o curso "${course?.name}" na SKY Brasil Academy! Verifique em:`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const copyVerificationCode = () => {
    if (certificate?.validation_code) {
      navigator.clipboard.writeText(certificate.validation_code);
      toast.success('Código copiado!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show eligibility check or generate button
  if (!certificate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/members/courses/${productId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar ao Curso
            </Button>
          </Link>
        </div>

        <div className="text-center py-12">
          <Award className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Certificado de Conclusão</h1>
          <p className="text-muted-foreground mb-6">{course?.name}</p>

          {eligibility?.eligible ? (
            <>
              <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
                <CheckCircle className="w-5 h-5" />
                <span>Você está apto a receber o certificado!</span>
              </div>
              
              {eligibility.quizScores && eligibility.quizScores.length > 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Média das provas: {Math.round(eligibility.quizScores.reduce((a, b) => a + b, 0) / eligibility.quizScores.length)}%
                </p>
              )}

              <Button 
                size="lg" 
                onClick={() => setShowNameDialog(true)}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Gerar Meu Certificado
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg max-w-md mx-auto mb-6">
                <p className="text-muted-foreground">
                  {eligibility?.reason || 'Você precisa concluir o curso para obter o certificado.'}
                </p>
              </div>
              <Link to={`/members/courses/${productId}`}>
                <Button>Continuar Estudando</Button>
              </Link>
            </>
          )}
        </div>

        {/* Name Dialog */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Informações do Certificado</DialogTitle>
              <DialogDescription>
                Confirme o nome que aparecerá no seu certificado
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Este nome será impresso no certificado e não poderá ser alterado posteriormente.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateCertificate} disabled={!studentName.trim()}>
                Gerar Certificado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show certificate
  const completedDate = new Date(certificate.issued_at).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header - Hide on Print */}
      <div className="flex items-center justify-between print:hidden no-print">
        <Link to="/members/certificates">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshSettings}
            disabled={settingsLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", settingsLoading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <LinkedInShareButton
            certificateUrl={`/verificar-certificado/${certificate.validation_code}`}
            courseName={certificate.course_name}
            studentName={certificate.student_name}
          />
        </div>
      </div>

      {/* Verification badge - Hide on Print */}
      <div className="flex items-center justify-center gap-4 print:hidden no-print">
        <Badge variant="outline" className="gap-2 px-4 py-2">
          <Shield className="w-4 h-4 text-green-600" />
          Certificado Verificável
        </Badge>
        <Button variant="ghost" size="sm" onClick={copyVerificationCode} className="font-mono">
          Código: {certificate.validation_code}
          <Copy className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Certificate - Professional Print Design */}
      <div 
        ref={certificateRef}
        className="bg-white text-black max-w-4xl mx-auto relative overflow-hidden certificate-print print-content"
        style={{ 
          aspectRatio: '297/210',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}
      >
        {/* Decorative Border - Triple line */}
        <div className="absolute inset-3 border-[3px] border-blue-900" />
        <div className="absolute inset-5 border-2 border-blue-700" />
        <div className="absolute inset-7 border border-blue-500/50" />

        {/* Corner Ornaments */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-600" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-amber-600" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-amber-600" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-amber-600" />

        {/* Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Award className="w-[300px] h-[300px] text-blue-900" />
        </div>

        {/* Certificate Content */}
        <div className="relative h-full flex flex-col items-center justify-between py-12 px-16 text-center">
          {/* Header Section */}
          <div className="space-y-2">
            {/* Institution Logo */}
            <div className="flex items-center justify-center gap-3 mb-2">
              {companySettings?.logo_url ? (
                <img 
                  src={companySettings.logo_url} 
                  alt={companySettings.company_name} 
                  className="h-14 object-contain"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
              )}
            </div>
            
            <h2 className="text-sm uppercase tracking-[0.4em] text-blue-900 font-medium">
              {companySettings?.company_name || 'SKY Brasil Academy'}
            </h2>
            <p className="text-xs text-gray-500">
              {companySettings?.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''}
              {companySettings?.legal_name ? ` | ${companySettings.legal_name}` : ''}
            </p>
          </div>

          {/* Title Section */}
          <div className="space-y-4 -mt-4">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-amber-500" />
              <h1 className="text-3xl font-serif font-bold text-blue-900 tracking-wide">
                CERTIFICADO
              </h1>
              <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-amber-500" />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">de Conclusão de Curso</p>
          </div>

          {/* Main Content */}
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-gray-600">
              Certificamos que
            </p>
            
            <h3 className="text-2xl font-bold text-blue-900 border-b-2 border-amber-500 pb-2 px-8 inline-block">
              {certificate.student_name}
            </h3>
            
            <p className="text-sm text-gray-600">
              concluiu com êxito o curso de
            </p>
            
            <h4 className="text-xl font-semibold text-blue-800">
              {certificate.course_name}
            </h4>

            {/* Course Details */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 pt-2">
              {certificate.course_hours > 0 && (
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Carga Horária:</span> {certificate.course_hours} horas
                </span>
              )}
              {certificate.final_score !== null && (
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Aproveitamento:</span> {certificate.final_score}%
                </span>
              )}
            </div>
          </div>

          {/* Footer Section */}
          <div className="w-full space-y-6">
            {/* Date */}
            <p className="text-sm text-gray-600">
              {companySettings?.address_city || 'São Paulo'}, {completedDate}
            </p>

            {/* Signatures */}
            <div className="flex justify-center gap-24">
              {companySettings?.academic_coordinator_name && (
                <div className="text-center">
                  {companySettings.academic_coordinator_signature_url && (
                    <img 
                      src={companySettings.academic_coordinator_signature_url} 
                      alt="Assinatura" 
                      className="h-10 mx-auto mb-1 object-contain"
                    />
                  )}
                  <div className="w-40 border-t-2 border-gray-800 pt-2">
                    <p className="text-sm font-bold text-gray-800">{companySettings.academic_coordinator_name}</p>
                    <p className="text-xs text-gray-500">{companySettings.academic_coordinator_role || 'Coordenador Acadêmico'}</p>
                  </div>
                </div>
              )}
              {companySettings?.legal_representative_name && (
                <div className="text-center">
                  {companySettings.legal_representative_signature_url && (
                    <img 
                      src={companySettings.legal_representative_signature_url} 
                      alt="Assinatura" 
                      className="h-10 mx-auto mb-1 object-contain"
                    />
                  )}
                  <div className="w-40 border-t-2 border-gray-800 pt-2">
                    <p className="text-sm font-bold text-gray-800">{companySettings.legal_representative_name}</p>
                    <p className="text-xs text-gray-500">{companySettings.legal_representative_role || 'Diretor'}</p>
                  </div>
                </div>
              )}
              {/* Fallback if no signatories configured */}
              {!companySettings?.academic_coordinator_name && !companySettings?.legal_representative_name && (
                <>
                  <div className="text-center">
                    <div className="w-40 border-t-2 border-gray-800 pt-2">
                      <p className="text-sm font-bold text-gray-800">Coordenação Acadêmica</p>
                      <p className="text-xs text-gray-500">Coordenador</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-t-2 border-gray-800 pt-2">
                      <p className="text-sm font-bold text-gray-800">Direção</p>
                      <p className="text-xs text-gray-500">Diretor</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Certificate ID and Verification */}
            <div className="flex justify-between items-end text-[10px] text-gray-400 px-4 pt-4 border-t border-gray-200">
              <div className="text-left">
                <p className="font-mono">Certificado Nº: {certificate.certificate_number}</p>
                <p className="font-mono">Código de Validação: {certificate.validation_code}</p>
              </div>
              <div className="text-right">
                <p>Verifique a autenticidade em:</p>
                <p className="font-mono text-blue-700">
                  {companySettings?.website || window.location.origin}/verificar-certificado/{certificate.validation_code}
                </p>
              </div>
            </div>
            
            {/* Company footer text */}
            {companySettings?.certificate_footer_text && (
              <p className="text-[9px] text-center text-gray-400 px-8">
                {companySettings.certificate_footer_text}
              </p>
            )}
          </div>

          {/* Official Stamp */}
          <div className="absolute bottom-20 right-20 opacity-60">
            <div className="w-20 h-20 border-[3px] border-blue-800 rounded-full flex items-center justify-center rotate-[-12deg]">
              <div className="text-center">
                <Shield className="w-5 h-5 text-blue-800 mx-auto" />
                <p className="text-[5px] font-bold text-blue-800 uppercase mt-0.5">
                  {(companySettings?.company_name || 'SKY Brasil').split(' ')[0]}
                </p>
                <p className="text-[4px] text-blue-800">Documento</p>
                <p className="text-[4px] text-blue-800">Autêntico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
