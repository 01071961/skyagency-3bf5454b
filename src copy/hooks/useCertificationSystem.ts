import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';

interface CertificationProgress {
  productId: string;
  productName: string;
  courseProgress: number;
  examsCompleted: number;
  examsPassed: number;
  averageScore: number;
  isEligibleForCertificate: boolean;
  hasCertificate: boolean;
  certificateId?: string;
}

interface ExamResult {
  examId: string;
  examTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export function useCertificationSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<CertificationProgress[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch enrollments with products
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          progress_percent,
          product:products(id, name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Fetch exam attempts
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          score,
          passed,
          completed_at,
          exam:financial_exams(title)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      // Fetch existing certificates
      const { data: certificates } = await supabase
        .from('course_certificates')
        .select('id, product_id')
        .eq('user_id', user.id);

      const certMap = new Map(certificates?.map(c => [c.product_id, c.id]) || []);

      // Process enrollments
      const progressData: CertificationProgress[] = (enrollments || []).map(enrollment => {
        const product = Array.isArray(enrollment.product) 
          ? enrollment.product[0] 
          : enrollment.product;
        
        // Filter exam attempts for this product's related exams
        const relatedAttempts = attempts?.filter(a => a.passed) || [];
        const avgScore = relatedAttempts.length > 0
          ? relatedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / relatedAttempts.length
          : 0;

        return {
          productId: enrollment.product_id,
          productName: product?.name || 'Curso',
          courseProgress: enrollment.progress_percent || 0,
          examsCompleted: relatedAttempts.length,
          examsPassed: relatedAttempts.filter(a => a.passed).length,
          averageScore: Math.round(avgScore),
          isEligibleForCertificate: (enrollment.progress_percent || 0) >= 100,
          hasCertificate: certMap.has(enrollment.product_id),
          certificateId: certMap.get(enrollment.product_id)
        };
      });

      // Process exam results
      const resultsData: ExamResult[] = (attempts || []).map(attempt => ({
        examId: attempt.exam_id,
        examTitle: (attempt.exam as any)?.title || 'Exame',
        score: attempt.score || 0,
        passed: attempt.passed || false,
        completedAt: attempt.completed_at || ''
      }));

      setProgress(progressData);
      setExamResults(resultsData);
    } catch (error) {
      console.error('Error fetching certification progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const generateCertificate = async (productId: string, studentName?: string) => {
    if (!user) return null;

    try {
      // Check if already has certificate
      const { data: existing } = await supabase
        .from('course_certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        toast.info('Certificado já foi emitido para este curso');
        return existing.id;
      }

      // Get product info
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();

      // Get profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      // Calculate course hours from lessons
      const { data: lessons } = await supabase
        .from('product_lessons')
        .select('video_duration, module:product_modules!inner(product_id)')
        .eq('module.product_id', productId);

      const totalMinutes = (lessons || []).reduce((acc, l) => acc + ((l.video_duration || 0) / 60), 0);
      const courseHours = Math.max(1, Math.round(totalMinutes / 60));

      // Get average exam score
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('score')
        .eq('user_id', user.id)
        .eq('passed', true);

      const avgScore = attempts && attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
        : 100;

      // Generate codes
      const certNumber = `SKY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const valCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create certificate
      const { data: newCert, error } = await supabase
        .from('course_certificates')
        .insert({
          user_id: user.id,
          product_id: productId,
          student_name: studentName || profile?.name || user.email?.split('@')[0] || 'Aluno',
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

      toast.success('🎓 Certificado gerado com sucesso!');
      fetchProgress();
      
      return newCert.id;
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado: ' + error.message);
      return null;
    }
  };

  return {
    loading,
    progress,
    examResults,
    generateCertificate,
    refresh: fetchProgress
  };
}
