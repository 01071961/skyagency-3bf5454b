import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  totalHoursStudied: number;
  averageScore: number;
  currentStreak: number;
  examsCompleted: number;
  examsPassed: number;
}

interface AffiliateStats {
  isAffiliate: boolean;
  tier: string;
  totalEarnings: number;
  pendingEarnings: number;
  referralCount: number;
  conversionRate: number;
  salesThisMonth: number;
  tierProgress: number;
  nextTier: string | null;
  isCreator: boolean;
}

interface UnifiedDashboardData {
  student: StudentStats;
  affiliate: AffiliateStats;
  recentActivity: {
    type: 'course' | 'exam' | 'certificate' | 'sale';
    title: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }[];
}

const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];

export function useUnifiedDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UnifiedDashboardData>({
    student: {
      enrolledCourses: 0,
      completedCourses: 0,
      certificates: 0,
      totalHoursStudied: 0,
      averageScore: 0,
      currentStreak: 0,
      examsCompleted: 0,
      examsPassed: 0
    },
    affiliate: {
      isAffiliate: false,
      tier: 'bronze',
      totalEarnings: 0,
      pendingEarnings: 0,
      referralCount: 0,
      conversionRate: 0,
      salesThisMonth: 0,
      tierProgress: 0,
      nextTier: null,
      isCreator: false
    },
    recentActivity: []
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch student data
      const [
        { data: enrollments },
        { data: certificates },
        { data: examAttempts },
        { data: affiliate },
        { data: commissions }
      ] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id, progress_percent, status, product:products(name)')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('course_certificates')
          .select('id, course_name, issued_at')
          .eq('user_id', user.id),
        supabase
          .from('exam_attempts')
          .select('id, score, passed, completed_at, exam:financial_exams(title)')
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('vip_affiliates')
          .select('id, tier, total_earnings, referral_count, is_creator, status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .maybeSingle(),
        supabase
          .from('affiliate_commissions')
          .select('id, commission_amount, status, created_at')
          .eq('affiliate_id', user.id)
      ]);

      // Calculate student stats
      const enrollmentList = enrollments || [];
      const completedCourses = enrollmentList.filter(e => (e.progress_percent || 0) >= 100).length;
      const attemptsList = examAttempts || [];
      const passedExams = attemptsList.filter(a => a.passed);
      const avgScore = attemptsList.length > 0
        ? Math.round(attemptsList.reduce((sum, a) => sum + (a.score || 0), 0) / attemptsList.length)
        : 0;

      // Calculate affiliate stats
      const commissionsList = commissions || [];
      const pendingCommissions = commissionsList.filter(c => c.status === 'pending');
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const salesThisMonth = commissionsList.filter(
        c => new Date(c.created_at) >= thisMonth
      ).length;

      // Calculate tier progress
      let tierProgress = 0;
      let nextTier: string | null = null;
      if (affiliate) {
        const currentTierIndex = tierOrder.indexOf(affiliate.tier?.toLowerCase() || 'bronze');
        if (currentTierIndex < tierOrder.length - 1) {
          nextTier = tierOrder[currentTierIndex + 1];
          // Simple progress calculation based on referrals/earnings
          const thresholds = { bronze: 0, silver: 5, gold: 20, diamond: 50, platinum: 100 };
          const currentThreshold = thresholds[affiliate.tier?.toLowerCase() as keyof typeof thresholds] || 0;
          const nextThreshold = thresholds[nextTier as keyof typeof thresholds] || 100;
          tierProgress = Math.min(100, Math.round(
            ((affiliate.referral_count || 0) - currentThreshold) / (nextThreshold - currentThreshold) * 100
          ));
        } else {
          tierProgress = 100;
        }
      }

      // Build recent activity
      const recentActivity: UnifiedDashboardData['recentActivity'] = [];

      // Add recent certificates
      (certificates || []).slice(0, 3).forEach(cert => {
        recentActivity.push({
          type: 'certificate',
          title: `Certificado: ${cert.course_name}`,
          timestamp: cert.issued_at
        });
      });

      // Add recent exams
      attemptsList.slice(0, 3).forEach(exam => {
        recentActivity.push({
          type: 'exam',
          title: `Prova: ${(exam.exam as any)?.title || 'Simulado'}`,
          timestamp: exam.completed_at || '',
          metadata: { score: exam.score, passed: exam.passed }
        });
      });

      // Sort by timestamp
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setData({
        student: {
          enrolledCourses: enrollmentList.length,
          completedCourses,
          certificates: (certificates || []).length,
          totalHoursStudied: Math.round(enrollmentList.length * 5), // Estimate
          averageScore: avgScore,
          currentStreak: 0, // Would need daily tracking
          examsCompleted: attemptsList.length,
          examsPassed: passedExams.length
        },
        affiliate: {
          isAffiliate: !!affiliate,
          tier: affiliate?.tier || 'bronze',
          totalEarnings: affiliate?.total_earnings || 0,
          pendingEarnings: pendingCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          referralCount: affiliate?.referral_count || 0,
          conversionRate: (affiliate?.referral_count || 0) > 0 
            ? Math.round((salesThisMonth / (affiliate?.referral_count || 1)) * 100) 
            : 0,
          salesThisMonth,
          tierProgress,
          nextTier,
          isCreator: affiliate?.is_creator || false
        },
        recentActivity: recentActivity.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    loading,
    refresh: fetchData
  };
}
