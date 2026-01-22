import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';

interface CertificateData {
  id: string;
  certificate_number: string;
  validation_code: string;
  student_name: string;
  course_name: string;
  course_hours: number | null;
  final_score: number | null;
  issued_at: string;
}

export function useAutoCertificate(productId: string | undefined) {
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    if (user && productId) {
      checkCertificate();
    }
  }, [user, productId]);

  const checkCertificate = async () => {
    if (!user || !productId) return;

    try {
      // Check if certificate already exists
      const { data: existingCert } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingCert) {
        setCertificate(existingCert);
        setIsEligible(true);
        return;
      }

      // Check if user is eligible (100% progress)
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('progress_percent')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      setIsEligible(enrollment?.progress_percent >= 100);
    } catch (error) {
      console.error('Error checking certificate:', error);
    }
  };

  const generateCertificate = async (studentName?: string) => {
    if (!user || !productId || isGenerating) return null;

    setIsGenerating(true);
    try {
      // Get course info
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();

      // Get quiz scores for average
      const { data: quizAttempts } = await supabase
        .from('lesson_quiz_attempts')
        .select('score, lesson:product_lessons!inner(module:product_modules!inner(product_id))')
        .eq('user_id', user.id)
        .eq('passed', true);

      const relevantScores = (quizAttempts || [])
        .filter((a: any) => a.lesson?.module?.product_id === productId)
        .map((a: any) => a.score);

      const avgScore = relevantScores.length > 0
        ? Math.round(relevantScores.reduce((a: number, b: number) => a + b, 0) / relevantScores.length)
        : 100;

      // Get total course hours
      const { data: lessons } = await supabase
        .from('product_lessons')
        .select('video_duration, module:product_modules!inner(product_id)')
        .eq('module.product_id', productId);

      const totalMinutes = (lessons || [])
        .reduce((acc, l) => acc + ((l.video_duration || 0) / 60), 0);
      const courseHours = Math.max(1, Math.round(totalMinutes / 60));

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      const finalName = studentName || profile?.name || user.email?.split('@')[0] || 'Aluno';

      // Generate unique codes
      const certNumber = `SKY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const valCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create certificate
      const { data: newCert, error } = await supabase
        .from('course_certificates')
        .insert({
          user_id: user.id,
          product_id: productId,
          student_name: finalName,
          course_name: product?.name || 'Curso',
          course_hours: courseHours,
          final_score: avgScore,
          certificate_number: certNumber,
          validation_code: valCode,
          issued_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCertificate(newCert);
      toast.success('🎓 Certificado gerado com sucesso!');
      
      return newCert;
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    certificate,
    isEligible,
    isGenerating,
    generateCertificate,
    refresh: checkCertificate
  };
}
