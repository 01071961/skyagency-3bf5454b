import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer, Share2, Shield, Award, Copy, CheckCircle, FileDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { downloadCertificatePDF } from '@/lib/pdf/certificatePdfGenerator';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useRealtimeCompanySettings } from '@/hooks/useRealtimeCompanySettings';

interface CompanySettings {
  company_name: string;
  legal_name: string | null;
  cnpj: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  legal_representative_name: string | null;
  legal_representative_role: string | null;
  legal_representative_signature_url: string | null;
  academic_coordinator_name: string | null;
  academic_coordinator_role: string | null;
  academic_coordinator_signature_url: string | null;
  certificate_template: string | null;
  certificate_footer_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
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

interface ProfessionalCertificatePDFProps {
  certificate: CertificateData;
  onClose?: () => void;
}


export function ProfessionalCertificatePDF({ certificate, onClose }: ProfessionalCertificatePDFProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { logDocumentGeneration } = useAuditLog();
  
  // Use realtime company settings hook
  const { settings, loading, refresh: refreshCompanySettings } = useRealtimeCompanySettings();
  
  // Map settings to expected format with defaults
  const companySettings: CompanySettings = settings ? {
    company_name: settings.company_name || 'SKY Brasil Academy',
    legal_name: settings.legal_name || 'SKY Brasil Educação LTDA',
    cnpj: settings.cnpj || null,
    logo_url: settings.logo_url || null,
    email: settings.email || 'contato@skybrasil.com',
    phone: settings.phone || null,
    website: settings.website || 'skybrasil.com.br',
    address_street: settings.address_street || null,
    address_city: settings.address_city || 'São Paulo',
    address_state: settings.address_state || 'SP',
    address_zip: settings.address_zip || null,
    legal_representative_name: settings.legal_representative_name || 'Diretor Acadêmico',
    legal_representative_role: settings.legal_representative_role || 'Diretor',
    legal_representative_signature_url: settings.legal_representative_signature_url || null,
    academic_coordinator_name: settings.academic_coordinator_name || 'Coordenador Acadêmico',
    academic_coordinator_role: settings.academic_coordinator_role || 'Coordenador',
    academic_coordinator_signature_url: settings.academic_coordinator_signature_url || null,
    certificate_template: settings.certificate_template || 'modern',
    certificate_footer_text: settings.certificate_footer_text || 'Este certificado é válido em todo território nacional',
    primary_color: settings.primary_color || '#1e3a5f',
    secondary_color: settings.secondary_color || '#d4a574'
  } : {
    company_name: 'SKY Brasil Academy',
    legal_name: 'SKY Brasil Educação LTDA',
    cnpj: null,
    logo_url: null,
    email: 'contato@skybrasil.com',
    phone: null,
    website: 'skybrasil.com.br',
    address_street: null,
    address_city: 'São Paulo',
    address_state: 'SP',
    address_zip: null,
    legal_representative_name: 'Diretor Acadêmico',
    legal_representative_role: 'Diretor',
    legal_representative_signature_url: null,
    academic_coordinator_name: 'Coordenador Acadêmico',
    academic_coordinator_role: 'Coordenador',
    academic_coordinator_signature_url: null,
    certificate_template: 'modern',
    certificate_footer_text: 'Este certificado é válido em todo território nacional',
    primary_color: '#1e3a5f',
    secondary_color: '#d4a574'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!companySettings) return;
    
    setDownloading(true);
    try {
      await downloadCertificatePDF(certificate, companySettings);
      
      // Log the document generation
      await logDocumentGeneration({
        documentType: 'certificate',
        documentId: certificate.id,
        documentNumber: certificate.certificate_number,
        recipientName: certificate.student_name,
        metadata: {
          course_name: certificate.course_name,
          validation_code: certificate.validation_code
        }
      });
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/verificar-certificado/${certificate.validation_code}`;
    if (navigator.share) {
      navigator.share({
        title: `Certificado - ${certificate.course_name}`,
        text: `Verifique meu certificado do curso "${certificate.course_name}"`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const copyValidationCode = () => {
    navigator.clipboard.writeText(certificate.validation_code);
    toast.success('Código copiado!');
  };

  const completedDate = new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const primaryColor = companySettings?.primary_color || '#1e3a5f';
  const secondaryColor = companySettings?.secondary_color || '#d4a574';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions - Hidden on print */}
      <div className="flex items-center justify-between print:hidden no-print">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Shield className="w-4 h-4 text-green-600" />
            Certificado Verificável
          </Badge>
          <Button variant="ghost" size="sm" onClick={copyValidationCode} className="font-mono">
            Código: {certificate.validation_code}
            <Copy className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshCompanySettings}
            disabled={loading}
            title="Sincronizar configurações da empresa"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            size="sm" 
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-primary"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            {downloading ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <div
        ref={certificateRef}
        className="bg-white text-black max-w-4xl mx-auto relative overflow-hidden certificate-print print-content"
        style={{
          aspectRatio: '297/210',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}
      >
        {/* Decorative Border */}
        <div 
          className="absolute inset-3 border-[3px]" 
          style={{ borderColor: primaryColor }}
        />
        <div 
          className="absolute inset-5 border-2" 
          style={{ borderColor: primaryColor, opacity: 0.7 }}
        />
        <div 
          className="absolute inset-7 border" 
          style={{ borderColor: primaryColor, opacity: 0.4 }}
        />

        {/* Corner Ornaments */}
        <div 
          className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4" 
          style={{ borderColor: secondaryColor }}
        />
        <div 
          className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4" 
          style={{ borderColor: secondaryColor }}
        />
        <div 
          className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4" 
          style={{ borderColor: secondaryColor }}
        />
        <div 
          className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4" 
          style={{ borderColor: secondaryColor }}
        />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Award className="w-[300px] h-[300px]" style={{ color: primaryColor }} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-between py-12 px-16 text-center">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              {companySettings?.logo_url ? (
                <img 
                  src={companySettings.logo_url} 
                  alt={companySettings.company_name}
                  className="h-14 object-contain"
                />
              ) : (
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  <Award className="w-8 h-8" style={{ color: secondaryColor }} />
                </div>
              )}
            </div>
            
            <h2 
              className="text-sm uppercase tracking-[0.4em] font-medium"
              style={{ color: primaryColor }}
            >
              {companySettings?.company_name}
            </h2>
            <p className="text-xs text-gray-500">
              {companySettings?.cnpj && `CNPJ: ${companySettings.cnpj}`}
              {companySettings?.cnpj && companySettings?.website && ' | '}
              {companySettings?.website}
            </p>
          </div>

          {/* Title */}
          <div className="space-y-4 -mt-4">
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-16 h-[2px]" 
                style={{ background: `linear-gradient(to right, transparent, ${secondaryColor})` }}
              />
              <h1 
                className="text-3xl font-serif font-bold tracking-wide"
                style={{ color: primaryColor }}
              >
                CERTIFICADO
              </h1>
              <div 
                className="w-16 h-[2px]" 
                style={{ background: `linear-gradient(to left, transparent, ${secondaryColor})` }}
              />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              de Conclusão de Curso
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-gray-600">
              Certificamos que
            </p>
            
            <h3 
              className="text-2xl font-bold pb-2 px-8 inline-block border-b-2"
              style={{ color: primaryColor, borderColor: secondaryColor }}
            >
              {certificate.student_name}
            </h3>
            
            <p className="text-sm text-gray-600">
              concluiu com êxito o curso de
            </p>
            
            <h4 
              className="text-xl font-semibold"
              style={{ color: primaryColor }}
            >
              {certificate.course_name}
            </h4>

            {/* Course Details */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 pt-2">
              {certificate.course_hours > 0 && (
                <span>
                  <span className="font-semibold">Carga Horária:</span> {certificate.course_hours} horas
                </span>
              )}
              {certificate.final_score !== null && (
                <span>
                  <span className="font-semibold">Aproveitamento:</span> {certificate.final_score}%
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="w-full space-y-6">
            <p className="text-sm text-gray-600">
              {companySettings?.address_city}, {completedDate}
            </p>

            {/* Signatures */}
            <div className="flex justify-center gap-24">
              {companySettings?.academic_coordinator_name && (
                <div className="text-center">
                  {companySettings.academic_coordinator_signature_url && (
                    <img 
                      src={companySettings.academic_coordinator_signature_url}
                      alt="Assinatura"
                      className="h-10 mx-auto mb-1"
                    />
                  )}
                  <div className="w-40 border-t-2 border-gray-800 pt-2">
                    <p className="text-sm font-bold text-gray-800">
                      {companySettings.academic_coordinator_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {companySettings.academic_coordinator_role || 'Coordenador Acadêmico'}
                    </p>
                  </div>
                </div>
              )}
              
              {companySettings?.legal_representative_name && (
                <div className="text-center">
                  {companySettings.legal_representative_signature_url && (
                    <img 
                      src={companySettings.legal_representative_signature_url}
                      alt="Assinatura"
                      className="h-10 mx-auto mb-1"
                    />
                  )}
                  <div className="w-40 border-t-2 border-gray-800 pt-2">
                    <p className="text-sm font-bold text-gray-800">
                      {companySettings.legal_representative_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {companySettings.legal_representative_role || 'Diretor'}
                    </p>
                  </div>
                </div>
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
                <p className="font-mono" style={{ color: primaryColor }}>
                  {companySettings?.website || 'skybrasil.com.br'}/verificar/{certificate.validation_code}
                </p>
              </div>
            </div>

            {companySettings?.certificate_footer_text && (
              <p className="text-[9px] text-gray-400 text-center">
                {companySettings.certificate_footer_text}
              </p>
            )}
          </div>

          {/* Official Stamp */}
          <div className="absolute bottom-20 right-20 opacity-60">
            <div 
              className="w-20 h-20 border-[3px] rounded-full flex items-center justify-center rotate-[-12deg]"
              style={{ borderColor: primaryColor }}
            >
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto" style={{ color: primaryColor }} />
                <p 
                  className="text-[5px] font-bold uppercase mt-0.5"
                  style={{ color: primaryColor }}
                >
                  {companySettings?.company_name?.split(' ')[0]}
                </p>
                <p className="text-[4px]" style={{ color: primaryColor }}>Documento</p>
                <p className="text-[4px]" style={{ color: primaryColor }}>Autêntico</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print, .print\\:hidden {
            display: none !important;
          }
          
          .certificate-print {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfessionalCertificatePDF;
