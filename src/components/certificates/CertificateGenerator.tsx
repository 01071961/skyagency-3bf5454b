import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateCertificateParams {
  userId: string;
  productId: string;
  studentName: string;
  courseName: string;
  courseHours?: number;
  finalScore?: number;
  sendEmail?: boolean;
  recipientEmail?: string;
}

interface CertificateResult {
  success: boolean;
  certificateId?: string;
  validationCode?: string;
  certificateNumber?: string;
  error?: string;
}

// Generate a unique 8-character validation code
function generateValidationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate certificate number in format: SKY-YYYY-XXXXX
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `SKY-${year}-${random}`;
}

export async function checkCertificateEligibility(
  userId: string,
  productId: string
): Promise<{ eligible: boolean; reason?: string; quizScores?: number[] }> {
  try {
    // 1. Check enrollment progress
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('progress_percent')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return { eligible: false, reason: 'Matrícula não encontrada' };
    }

    if (enrollment.progress_percent < 100) {
      return { 
        eligible: false, 
        reason: `Progresso insuficiente: ${enrollment.progress_percent}% (necessário: 100%)`
      };
    }

    // 2. Check if all required quizzes are passed
    const { data: lessons, error: lessonsError } = await supabase
      .from('product_lessons')
      .select(`
        id,
        name,
        quiz_required,
        quiz_passing_score,
        module:product_modules!inner(product_id)
      `)
      .eq('module.product_id', productId)
      .eq('content_type', 'quiz')
      .eq('quiz_required', true);

    if (lessonsError) {
      console.error('Error fetching quiz lessons:', lessonsError);
      return { eligible: false, reason: 'Erro ao verificar provas' };
    }

    const quizScores: number[] = [];

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        // Get best attempt for each required quiz
        const { data: attempts, error: attemptsError } = await supabase
          .from('lesson_quiz_attempts')
          .select('score, passed')
          .eq('user_id', userId)
          .eq('lesson_id', lesson.id)
          .eq('passed', true)
          .order('score', { ascending: false })
          .limit(1);

        if (attemptsError) {
          console.error('Error fetching quiz attempts:', attemptsError);
          continue;
        }

        if (!attempts || attempts.length === 0) {
          return { 
            eligible: false, 
            reason: `Prova obrigatória não aprovada: ${lesson.name}`
          };
        }

        quizScores.push(attempts[0].score);
      }
    }

    // 3. Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('course_certificates')
      .select('id, validation_code')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingCert) {
      return { 
        eligible: true, 
        reason: 'Certificado já emitido',
        quizScores
      };
    }

    return { eligible: true, quizScores };

  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    return { eligible: false, reason: 'Erro ao verificar elegibilidade' };
  }
}

export async function generateCertificate(
  params: GenerateCertificateParams
): Promise<CertificateResult> {
  const { userId, productId, studentName, courseName, courseHours = 0, finalScore, sendEmail = true, recipientEmail } = params;

  try {
    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('course_certificates')
      .select('id, validation_code, certificate_number')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingCert) {
      return {
        success: true,
        certificateId: existingCert.id,
        validationCode: existingCert.validation_code,
        certificateNumber: existingCert.certificate_number
      };
    }

    // Generate unique codes
    let validationCode = generateValidationCode();
    let certificateNumber = generateCertificateNumber();

    // Ensure validation code is unique
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('course_certificates')
        .select('id')
        .eq('validation_code', validationCode)
        .maybeSingle();

      if (!existing) break;
      validationCode = generateValidationCode();
      attempts++;
    }

    // Create certificate
    const { data: newCert, error } = await supabase
      .from('course_certificates')
      .insert({
        user_id: userId,
        product_id: productId,
        certificate_number: certificateNumber,
        validation_code: validationCode,
        student_name: studentName,
        course_name: courseName,
        course_hours: courseHours,
        final_score: finalScore,
        issued_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Certificado gerado com sucesso!');

    // Send email notification if enabled
    if (sendEmail && recipientEmail) {
      try {
        await supabase.functions.invoke('send-certificate-email', {
          body: {
            certificate_id: newCert.id,
            recipient_email: recipientEmail,
            recipient_name: studentName
          }
        });
      } catch (emailError) {
        console.error('Error sending certificate email:', emailError);
        // Don't fail the certificate generation if email fails
      }
    }

    return {
      success: true,
      certificateId: newCert.id,
      validationCode: newCert.validation_code,
      certificateNumber: newCert.certificate_number
    };

  } catch (error: any) {
    console.error('Error generating certificate:', error);
    toast.error('Erro ao gerar certificado');
    return {
      success: false,
      error: error.message || 'Erro desconhecido'
    };
  }
}

export async function getCertificateByProduct(
  userId: string,
  productId: string
) {
  const { data, error } = await supabase
    .from('course_certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching certificate:', error);
    return null;
  }

  return data;
}
