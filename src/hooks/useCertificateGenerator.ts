import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { generateCertificatePDF } from '@/lib/pdf/certificatePdfGenerator';

interface GenerateCertificateParams {
  productId: string;
  courseName: string;
  courseHours?: number;
  score?: number;
  studentName: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  layout: any;
  is_default: boolean;
}

interface CompanySettings {
  company_name: string;
  legal_name: string | null;
  cnpj: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_city: string | null;
  address_state: string | null;
  legal_representative_name: string | null;
  legal_representative_role: string | null;
  legal_representative_signature_url: string | null;
  academic_coordinator_name: string | null;
  academic_coordinator_role: string | null;
  academic_coordinator_signature_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  certificate_footer_text: string | null;
  certificate_template_id: string | null;
}

export function useCertificateGenerator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateCertificateParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // 1. Fetch company settings
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      // 2. Fetch template if specified in company settings
      let template: CertificateTemplate | null = null;
      if (company?.certificate_template_id) {
        const { data: templateData } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('id', company.certificate_template_id)
          .single();
        template = templateData as CertificateTemplate;
      }

      // 3. Generate certificate number and validation code
      const certificateNumber = `SKY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const validationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 4. Check if course_certificate already exists
      const { data: existingCert } = await supabase
        .from('course_certificates')
        .select('id, certificate_number, validation_code')
        .eq('user_id', user.id)
        .eq('product_id', params.productId)
        .maybeSingle();

      let certificateId: string;
      let certNumber: string;
      let valCode: string;

      if (existingCert) {
        certificateId = existingCert.id;
        certNumber = existingCert.certificate_number;
        valCode = existingCert.validation_code;
      } else {
        // Create course_certificate record
        const { data: newCert, error: certError } = await supabase
          .from('course_certificates')
          .insert({
            user_id: user.id,
            product_id: params.productId,
            student_name: params.studentName,
            course_name: params.courseName,
            course_hours: params.courseHours || 0,
            final_score: params.score || null,
            certificate_number: certificateNumber,
            validation_code: validationCode,
            issued_at: new Date().toISOString()
          })
          .select()
          .single();

        if (certError) throw certError;
        certificateId = newCert.id;
        certNumber = certificateNumber;
        valCode = validationCode;
      }

      // 5. Generate PDF
      const certificateData = {
        certificate_number: certNumber,
        validation_code: valCode,
        student_name: params.studentName,
        course_name: params.courseName,
        course_hours: params.courseHours || 0,
        final_score: params.score || null,
        issued_at: new Date().toISOString()
      };

      const pdfBlob = await generateCertificatePDF(
        certificateData,
        company as CompanySettings | null
      );

      // 6. Upload PDF to storage
      const fileName = `certificates/${user.id}/${params.productId}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-content')
        .upload(fileName, pdfBlob, { 
          contentType: 'application/pdf',
          upsert: true 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Erro ao fazer upload do certificado');
      }

      // 7. Get public URL
      const { data: urlData } = supabase.storage
        .from('product-content')
        .getPublicUrl(fileName);

      // 8. Update generated_certificates table
      await supabase
        .from('generated_certificates')
        .upsert({
          user_id: user.id,
          product_id: params.productId,
          course_certificate_id: certificateId,
          template_id: template?.id || null,
          pdf_url: urlData.publicUrl,
          status: 'generated',
          generated_at: new Date().toISOString(),
          metadata: {
            score: params.score,
            course_hours: params.courseHours,
            generated_by: 'user'
          }
        }, {
          onConflict: 'user_id,product_id'
        });

      return {
        certificateId,
        pdfUrl: urlData.publicUrl,
        certificateNumber: certNumber,
        validationCode: valCode
      };
    },
    onSuccess: (data) => {
      toast.success('Certificado gerado com sucesso!', {
        description: `Número: ${data.certificateNumber}`,
        action: {
          label: 'Download',
          onClick: () => window.open(data.pdfUrl, '_blank')
        }
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['generated-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificates'] });
    },
    onError: (error: Error) => {
      console.error('Certificate generation error:', error);
      toast.error('Erro ao gerar certificado', {
        description: error.message
      });
    }
  });

  // Check if user has pending certificate
  const checkPendingCertificate = async (productId: string) => {
    if (!user?.id) return null;

    const { data } = await supabase
      .from('generated_certificates')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    return data;
  };

  // Download existing certificate
  const downloadCertificate = async (pdfUrl: string, certificateNumber: string) => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao fazer download');
    }
  };

  return {
    generateCertificate: generateMutation.mutate,
    generateCertificateAsync: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    checkPendingCertificate,
    downloadCertificate
  };
}
