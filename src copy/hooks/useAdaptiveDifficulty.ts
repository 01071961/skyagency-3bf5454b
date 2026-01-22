import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

interface PerformanceStats {
  totalCorrect: number;
  totalQuestions: number;
  byDifficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  byTopic: Record<string, { correct: number; total: number }>;
  currentStreak: number;
  estimatedLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface AdaptiveState {
  currentDifficulty: 'easy' | 'medium' | 'hard';
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  questionsAnswered: number;
  difficultyChanges: { from: string; to: string; atQuestion: number }[];
}

export function useAdaptiveDifficulty(lessonId: string) {
  const { user } = useAuth();
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>({
    currentDifficulty: 'medium',
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    questionsAnswered: 0,
    difficultyChanges: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch historical performance to determine initial difficulty
  useEffect(() => {
    if (user) {
      fetchHistoricalPerformance();
    }
  }, [user, lessonId]);

  const fetchHistoricalPerformance = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all previous attempts for this lesson and related lessons
      const { data: attempts } = await supabase
        .from('lesson_quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!attempts || attempts.length === 0) {
        // No history - start at medium difficulty
        setPerformanceStats({
          totalCorrect: 0,
          totalQuestions: 0,
          byDifficulty: {
            easy: { correct: 0, total: 0 },
            medium: { correct: 0, total: 0 },
            hard: { correct: 0, total: 0 }
          },
          byTopic: {},
          currentStreak: 0,
          estimatedLevel: 'intermediate'
        });
        setAdaptiveState(prev => ({ ...prev, currentDifficulty: 'medium' }));
      } else {
        // Calculate performance stats from history
        const stats = calculatePerformanceStats(attempts);
        setPerformanceStats(stats);
        
        // Set initial difficulty based on estimated level
        const initialDifficulty = stats.estimatedLevel === 'beginner' ? 'easy' 
          : stats.estimatedLevel === 'advanced' ? 'hard' : 'medium';
        setAdaptiveState(prev => ({ ...prev, currentDifficulty: initialDifficulty }));
      }
    } catch (error) {
      console.error('Error fetching historical performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceStats = (attempts: any[]): PerformanceStats => {
    let totalCorrect = 0;
    let totalQuestions = 0;
    const byDifficulty = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };
    const byTopic: Record<string, { correct: number; total: number }> = {};

    attempts.forEach(attempt => {
      totalCorrect += attempt.correct_answers || 0;
      totalQuestions += attempt.total_questions || 0;
    });

    const avgScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 50;
    
    // Determine level based on average score
    let estimatedLevel: 'beginner' | 'intermediate' | 'advanced';
    if (avgScore < 50) {
      estimatedLevel = 'beginner';
    } else if (avgScore >= 80) {
      estimatedLevel = 'advanced';
    } else {
      estimatedLevel = 'intermediate';
    }

    // Calculate current streak
    let currentStreak = 0;
    for (const attempt of attempts) {
      if (attempt.passed) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalCorrect,
      totalQuestions,
      byDifficulty,
      byTopic,
      currentStreak,
      estimatedLevel
    };
  };

  // Process an answer and adjust difficulty
  const processAnswer = useCallback((
    isCorrect: boolean,
    question: QuizQuestion
  ) => {
    setAdaptiveState(prev => {
      const newState = { ...prev };
      newState.questionsAnswered++;

      if (isCorrect) {
        newState.consecutiveCorrect++;
        newState.consecutiveIncorrect = 0;

        // Increase difficulty after 3 consecutive correct answers
        if (newState.consecutiveCorrect >= 3) {
          const newDifficulty = getDifficultyUp(prev.currentDifficulty);
          if (newDifficulty !== prev.currentDifficulty) {
            newState.difficultyChanges.push({
              from: prev.currentDifficulty,
              to: newDifficulty,
              atQuestion: newState.questionsAnswered
            });
            newState.currentDifficulty = newDifficulty;
            newState.consecutiveCorrect = 0;
          }
        }
      } else {
        newState.consecutiveIncorrect++;
        newState.consecutiveCorrect = 0;

        // Decrease difficulty after 2 consecutive incorrect answers
        if (newState.consecutiveIncorrect >= 2) {
          const newDifficulty = getDifficultyDown(prev.currentDifficulty);
          if (newDifficulty !== prev.currentDifficulty) {
            newState.difficultyChanges.push({
              from: prev.currentDifficulty,
              to: newDifficulty,
              atQuestion: newState.questionsAnswered
            });
            newState.currentDifficulty = newDifficulty;
            newState.consecutiveIncorrect = 0;
          }
        }
      }

      return newState;
    });

    // Update performance stats
    setPerformanceStats(prev => {
      if (!prev) return prev;
      
      const difficulty = question.difficulty || 'medium';
      const topic = question.topic || 'general';
      
      return {
        ...prev,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1,
        byDifficulty: {
          ...prev.byDifficulty,
          [difficulty]: {
            correct: prev.byDifficulty[difficulty].correct + (isCorrect ? 1 : 0),
            total: prev.byDifficulty[difficulty].total + 1
          }
        },
        byTopic: {
          ...prev.byTopic,
          [topic]: {
            correct: (prev.byTopic[topic]?.correct || 0) + (isCorrect ? 1 : 0),
            total: (prev.byTopic[topic]?.total || 0) + 1
          }
        }
      };
    });
  }, []);

  const getDifficultyUp = (current: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' => {
    if (current === 'easy') return 'medium';
    if (current === 'medium') return 'hard';
    return 'hard';
  };

  const getDifficultyDown = (current: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' => {
    if (current === 'hard') return 'medium';
    if (current === 'medium') return 'easy';
    return 'easy';
  };

  // Select next question based on current difficulty and performance
  const selectNextQuestion = useCallback((
    questions: QuizQuestion[],
    answeredIndices: Set<number>
  ): number | null => {
    const unanswered = questions
      .map((q, i) => ({ question: q, index: i }))
      .filter(({ index }) => !answeredIndices.has(index));

    if (unanswered.length === 0) return null;

    // Prioritize questions matching current difficulty
    const targetDifficulty = adaptiveState.currentDifficulty;
    const matchingDifficulty = unanswered.filter(
      ({ question }) => question.difficulty === targetDifficulty
    );

    if (matchingDifficulty.length > 0) {
      // If we have weak topics, prioritize those
      if (performanceStats) {
        const weakTopics = Object.entries(performanceStats.byTopic)
          .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.6)
          .map(([topic]) => topic);

        const weakTopicQuestions = matchingDifficulty.filter(
          ({ question }) => question.topic && weakTopics.includes(question.topic)
        );

        if (weakTopicQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * weakTopicQuestions.length);
          return weakTopicQuestions[randomIndex].index;
        }
      }

      // Random from matching difficulty
      const randomIndex = Math.floor(Math.random() * matchingDifficulty.length);
      return matchingDifficulty[randomIndex].index;
    }

    // Fallback to any unanswered question
    const randomIndex = Math.floor(Math.random() * unanswered.length);
    return unanswered[randomIndex].index;
  }, [adaptiveState.currentDifficulty, performanceStats]);

  // Get difficulty color for UI
  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
    }
  };

  // Get difficulty label in Portuguese
  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
    }
  };

  // Reset adaptive state for new quiz
  const resetAdaptive = useCallback(() => {
    const initialDifficulty = performanceStats?.estimatedLevel === 'beginner' ? 'easy' 
      : performanceStats?.estimatedLevel === 'advanced' ? 'hard' : 'medium';
    
    setAdaptiveState({
      currentDifficulty: initialDifficulty,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      questionsAnswered: 0,
      difficultyChanges: []
    });
  }, [performanceStats?.estimatedLevel]);

  return {
    adaptiveState,
    performanceStats,
    loading,
    processAnswer,
    selectNextQuestion,
    getDifficultyColor,
    getDifficultyLabel,
    resetAdaptive
  };
}
