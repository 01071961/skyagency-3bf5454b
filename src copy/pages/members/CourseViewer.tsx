import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  Lock, 
  FileText, 
  Download,
  ChevronLeft,
  Award,
  Clock,
  BookOpen,
  Calendar,
  List,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { CourseCompletionModal } from '@/components/CourseCompletionModal';
import LessonQuizPlayer from './LessonQuizPlayer';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  position: number;
  is_free_preview: boolean;
  lessons: Lesson[];
}

interface DownloadFile {
  url: string;
  name: string;
  type?: string;
}

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  position: number;
  content_type: string;
  video_url: string | null;
  video_duration: number | null;
  file_url: string | null;
  download_files?: DownloadFile[];
  is_free_preview: boolean;
  completed?: boolean;
  quiz_questions?: QuizQuestion[];
  quiz_passing_score?: number;
  quiz_time_limit?: number | null;
  quiz_required?: boolean;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  access_days: number | null;
}

interface Enrollment {
  enrolled_at: string;
  expires_at: string | null;
}

interface QuizAttempt {
  lesson_id: string;
  passed: boolean;
  score: number;
}

// Detect video type - supports CDN URLs with query params (Udemy, Cloudfront, etc.)
const getVideoType = (url: string): 'youtube' | 'vimeo' | 'googledrive' | 'onedrive' | 'supabase' | 'direct' | 'other' => {
  if (!url) return 'other';
  const trimmedUrl = url.trim();
  
  // Known platforms first
  if (trimmedUrl.match(/(?:youtube\.com|youtu\.be)/)) return 'youtube';
  if (trimmedUrl.match(/vimeo\.com/)) return 'vimeo';
  if (trimmedUrl.match(/drive\.google\.com/)) return 'googledrive';
  if (trimmedUrl.match(/(?:onedrive\.live\.com|1drv\.ms|sharepoint\.com)/)) return 'onedrive';
  if (trimmedUrl.includes('supabase.co/storage') || trimmedUrl.includes('.supabase.co/storage')) return 'supabase';
  
  // Direct video detection - SIMPLIFIED: detect ANY URL containing video extension
  // This matches .mp4, .webm, .ogg, .mov, .m4v, .avi anywhere in the URL
  if (trimmedUrl.match(/\.(?:mp4|webm|ogg|mov|m4v|avi)/i)) return 'direct';
  
  return 'other';
};

// Extract Google Drive file ID
const getGoogleDriveFileId = (url: string): string | null => {
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Convert video URLs to embeddable format - ALL formats supported including cloud drives
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // YouTube - ALL formats: watch?v=, embed/, v/, shorts/, youtu.be/
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Google Drive - multiple formats
  const googleDriveMatch = trimmedUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    return `https://drive.google.com/file/d/${googleDriveMatch[1]}/preview`;
  }
  
  // OneDrive / SharePoint
  if (trimmedUrl.includes('onedrive.live.com') || trimmedUrl.includes('1drv.ms') || trimmedUrl.includes('sharepoint.com')) {
    if (trimmedUrl.includes('/embed')) {
      return trimmedUrl;
    }
    if (trimmedUrl.includes('1drv.ms')) {
      return trimmedUrl.replace('1drv.ms', 'onedrive.live.com/embed');
    }
    if (trimmedUrl.includes('sharepoint.com')) {
      return trimmedUrl.includes('?') 
        ? `${trimmedUrl}&action=embedview` 
        : `${trimmedUrl}?action=embedview`;
    }
    return trimmedUrl;
  }
  
  // Wistia
  const wistiaMatch = trimmedUrl.match(/(?:wistia\.(?:com|net)\/(?:medias|embed)\/)([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
  }
  
  // Loom
  const loomMatch = trimmedUrl.match(/(?:loom\.com\/(?:share|embed)\/)([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  
  // Return original URL if no conversion needed
  return trimmedUrl;
};

// Google Drive Video Player Component with fallback
const GoogleDriveVideoPlayer = ({ url }: { url: string }) => {
  const [showFallback, setShowFallback] = useState(false);
  const fileId = getGoogleDriveFileId(url);
  
  if (!fileId) return null;
  
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  if (showFallback) {
    return (
      <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative">
        <video 
          src={directUrl}
          controls 
          className="w-full h-full"
          playsInline
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
        
        {/* Overlay with action buttons in case video doesn't load */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <a 
            href={viewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white/90 hover:bg-white text-black rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Assistir no Drive
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative">
      <iframe
        src={previewUrl}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
      
      {/* Fallback button always visible for Drive videos */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setShowFallback(true)}
          className="px-3 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Não carrega?
        </button>
        <a 
          href={viewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-2 bg-white/90 hover:bg-white text-black rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Play className="w-4 h-4" />
          Abrir no Drive
        </a>
      </div>
    </div>
  );
};

const CourseViewer = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [passedQuizzes, setPassedQuizzes] = useState<Map<string, number>>(new Map());
  const [viewMode, setViewMode] = useState<'all' | 'month'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);

  // Check if product is lifetime (no expiration)
  const isLifetime = !enrollment?.expires_at;
  
  // Calculate how many months of access based on enrollment
  const getAccessMonths = () => {
    if (isLifetime) {
      // Lifetime access - show all months based on content
      return Math.ceil(modules.length / 4) || 1;
    }
    
    // For time-limited access, calculate months from enrollment
    if (enrollment?.enrolled_at && enrollment?.expires_at) {
      const enrolledDate = new Date(enrollment.enrolled_at);
      const expiresDate = new Date(enrollment.expires_at);
      const monthsDiff = Math.ceil(
        (expiresDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      // Also consider how many months have passed since enrollment
      const now = new Date();
      const monthsSinceEnrollment = Math.ceil(
        (now.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      // Return minimum of total months or months passed (so content unlocks progressively)
      return Math.min(monthsDiff, Math.max(1, monthsSinceEnrollment));
    }
    
    return 1;
  };

  // Calculate how many months of content we have based on modules
  const totalContentMonths = Math.ceil(modules.length / 4) || 1;
  const accessibleMonths = getAccessMonths();

  // Get months available based on access
  const getAvailableMonths = () => {
    const months: number[] = [];
    const maxMonths = isLifetime ? totalContentMonths : Math.min(totalContentMonths, accessibleMonths);
    for (let i = 1; i <= maxMonths; i++) {
      months.push(i);
    }
    return months;
  };

  // Filter modules by selected month
  const getFilteredModules = () => {
    if (viewMode === 'all') return modules;
    
    // Each month has approximately 4 modules
    const modulesPerMonth = 4;
    const startIndex = (selectedMonth - 1) * modulesPerMonth;
    const endIndex = startIndex + modulesPerMonth;
    
    return modules.slice(startIndex, endIndex);
  };

  const filteredModules = getFilteredModules();

  useEffect(() => {
    if (productId && user) {
      fetchCourseData();
      fetchProgress();
      fetchUserProfile();
    }
  }, [productId, user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (data?.name) {
        setUserName(data.name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      // Fetch course info with access_days
      const { data: courseData, error: courseError } = await supabase
        .from('products')
        .select('id, name, description, cover_image_url, access_days')
        .eq('id', productId)
        .maybeSingle();

      if (courseError) throw courseError;
      
      if (!courseData) {
        toast.error('Curso não encontrado');
        setLoading(false);
        return;
      }
      
      setCourse(courseData);
      
      // Fetch enrollment info
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('enrolled_at, expires_at')
        .eq('product_id', productId)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!enrollmentError && enrollmentData) {
        setEnrollment(enrollmentData);
      } else if (!enrollmentData) {
        // User doesn't have access to this course
        toast.error('Você não tem acesso a este curso');
        setLoading(false);
        return;
      }

      // Fetch modules with lessons (including quiz fields and download_files)
      const { data: modulesData, error: modulesError } = await supabase
        .from('product_modules')
        .select(`
          id,
          name,
          description,
          position,
          is_free_preview,
          lessons:product_lessons(
            id,
            name,
            description,
            position,
            content_type,
            video_url,
            video_duration,
            file_url,
            download_files,
            is_free_preview,
            quiz_questions,
            quiz_passing_score,
            quiz_time_limit,
            quiz_required
          )
        `)
        .eq('product_id', productId)
        .order('position');

      if (modulesError) throw modulesError;

      const sortedModules = (modulesData || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).map(l => ({
          ...l,
          quiz_questions: Array.isArray(l.quiz_questions) ? l.quiz_questions as unknown as QuizQuestion[] : [],
          download_files: Array.isArray(l.download_files) ? l.download_files as unknown as DownloadFile[] : []
        })).sort((a, b) => a.position - b.position)
      })) as Module[];

      setModules(sortedModules);

      // Set first lesson as active if available
      if (sortedModules.length > 0 && sortedModules[0].lessons.length > 0) {
        setActiveLesson(sortedModules[0].lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Erro ao carregar o curso');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      // Fetch completed lessons
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (error) throw error;

      const completedIds = new Set((data || []).map(p => p.lesson_id));
      setCompletedLessons(completedIds);

      // Fetch passed quizzes
      const { data: quizData } = await supabase
        .from('lesson_quiz_attempts')
        .select('lesson_id, score')
        .eq('user_id', user?.id)
        .eq('passed', true);
      
      if (quizData) {
        const quizMap = new Map<string, number>();
        quizData.forEach(attempt => {
          const current = quizMap.get(attempt.lesson_id) || 0;
          if (attempt.score > current) {
            quizMap.set(attempt.lesson_id, attempt.score);
          }
        });
        setPassedQuizzes(quizMap);
      }

      // Calculate progress
      const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
      if (totalLessons > 0) {
        setProgress(Math.round((completedIds.size / totalLessons) * 100));
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user?.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });

      if (error) throw error;

      const newCompletedLessons = new Set([...completedLessons, lessonId]);
      setCompletedLessons(newCompletedLessons);
      toast.success('Aula marcada como concluída!');

      // Update enrollment progress
      const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const newProgress = Math.round((newCompletedLessons.size / totalLessons) * 100);
      setProgress(newProgress);

      await supabase
        .from('enrollments')
        .update({ 
          progress_percent: newProgress,
          last_accessed_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      // Check if course is 100% complete - show congratulations modal and create certificate record
      if (newProgress >= 100) {
        // Auto-create certificate record if doesn't exist
        try {
          const { data: existingCert } = await supabase
            .from('course_certificates')
            .select('id')
            .eq('user_id', user?.id)
            .eq('product_id', productId)
            .maybeSingle();

          if (!existingCert) {
            // Calculate average score from passed quizzes
            const quizScores = Array.from(passedQuizzes.values());
            const avgScore = quizScores.length > 0 
              ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
              : 100;

            // Calculate total course hours
            const totalMinutes = modules.reduce((acc, m) => 
              acc + m.lessons.reduce((lAcc, l) => lAcc + ((l.video_duration || 0) / 60), 0), 0
            );
            const courseHours = Math.max(1, Math.round(totalMinutes / 60));

            const certNumber = `SKY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const valCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            await supabase.from('course_certificates').insert({
              user_id: user?.id,
              product_id: productId,
              student_name: userName || user?.email?.split('@')[0] || 'Aluno',
              course_name: course?.name || 'Curso',
              course_hours: courseHours,
              final_score: avgScore,
              certificate_number: certNumber,
              validation_code: valCode,
              issued_at: new Date().toISOString()
            });

            console.log('Certificate record created automatically');
          }
        } catch (certError) {
          console.error('Error creating certificate record:', certError);
        }

        setTimeout(() => {
          setShowCompletionModal(true);
        }, 500);
      }

    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Erro ao marcar aula como concluída');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress for selected month
  const getMonthProgress = (month: number) => {
    const modulesPerMonth = 4;
    const startIndex = (month - 1) * modulesPerMonth;
    const endIndex = startIndex + modulesPerMonth;
    const monthModules = modules.slice(startIndex, endIndex);
    
    const totalLessons = monthModules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedCount = monthModules.reduce((acc, m) => 
      acc + m.lessons.filter(l => completedLessons.has(l.id)).length, 0
    );
    
    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show message if course doesn't exist or user has no access
  if (!course || !enrollment) {
    return (
      <div className="space-y-6">
        <Link to="/members/courses">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar aos Cursos
          </Button>
        </Link>
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Acesso não disponível</h3>
            <p className="text-muted-foreground mb-4">
              Você não tem acesso a este curso ou o curso não existe.
            </p>
            <Link to="/vendas">
              <Button>Ver Produtos Disponíveis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if course has no content yet
  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/members/courses">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold line-clamp-1">{course.name}</h1>
          </div>
        </div>
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Conteúdo em breve</h3>
            <p className="text-muted-foreground mb-4">
              O conteúdo deste curso está sendo preparado. Você será notificado quando estiver disponível.
            </p>
            <Link to="/members/courses">
              <Button variant="outline">Voltar aos Meus Cursos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/members/courses">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold line-clamp-1">{course?.name}</h1>
            {isLifetime ? (
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Vitalício
              </Badge>
            ) : enrollment?.expires_at && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Até {new Date(enrollment.expires_at).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <Progress value={progress} className="w-32 h-2" />
            <span className="text-sm text-muted-foreground">{progress}% concluído</span>
          </div>
        </div>
        {progress >= 100 && (
          <Link to={`/members/certificate/${productId}`}>
            <Button>
              <Award className="h-4 w-4 mr-2" />
              Ver Certificado
            </Button>
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video/Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quiz Player Mode - works for both quiz lessons AND video lessons with quiz */}
          {showQuizPlayer && activeLesson?.quiz_questions && activeLesson.quiz_questions.length > 0 ? (
            <LessonQuizPlayer
              lessonId={activeLesson.id}
              lessonName={activeLesson.name}
              questions={activeLesson.quiz_questions}
              passingScore={activeLesson.quiz_passing_score || 70}
              timeLimit={activeLesson.quiz_time_limit || null}
              onComplete={async (passed, score) => {
                setShowQuizPlayer(false);
                if (passed) {
                  setPassedQuizzes(prev => new Map(prev).set(activeLesson.id, score));
                  markLessonComplete(activeLesson.id);
                  
                  // Update historico_modulos with quiz score (using correct column names)
                  if (user && productId) {
                    const module = modules.find(m => m.lessons.some(l => l.id === activeLesson.id));
                    if (module) {
                      try {
                        await supabase.from('historico_modulos').upsert({
                          user_id: user.id,
                          product_id: productId,
                          modulo_id: module.id,
                          media_final: score,
                          situacao: 'aprovado',
                          data_conclusao: new Date().toISOString().split('T')[0],
                          updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,modulo_id' });
                        toast.success(`Nota ${score}% registrada no histórico escolar!`);
                      } catch (error) {
                        console.error('Error updating historico:', error);
                      }
                    }
                  }
                }
              }}
              onBack={() => setShowQuizPlayer(false)}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Quiz lesson */}
                {activeLesson?.content_type === 'quiz' ? (
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex flex-col items-center justify-center p-8">
                    <ClipboardList className="h-20 w-20 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{activeLesson.name}</h3>
                    {activeLesson.quiz_questions && activeLesson.quiz_questions.length > 0 ? (
                      <>
                        <p className="text-muted-foreground text-center mb-4">
                          {activeLesson.quiz_questions.length} questões • 
                          Nota mínima: {activeLesson.quiz_passing_score || 70}%
                          {activeLesson.quiz_time_limit && ` • Tempo: ${activeLesson.quiz_time_limit} min`}
                        </p>
                        {passedQuizzes.has(activeLesson.id) ? (
                          <div className="flex flex-col items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Aprovado com {passedQuizzes.get(activeLesson.id)}%
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => setShowQuizPlayer(true)}>
                              Refazer Prova
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => setShowQuizPlayer(true)} size="lg">
                            <Play className="w-5 h-5 mr-2" />
                            Iniciar Prova
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center">
                        Esta prova ainda não possui questões configuradas.
                      </p>
                    )}
                  </div>
                ) : activeLesson?.video_url ? (
                  // Handle different video types
                  (() => {
                    const videoType = getVideoType(activeLesson.video_url);
                    
                    // Google Drive videos need special handling
                    if (videoType === 'googledrive') {
                      return <GoogleDriveVideoPlayer url={activeLesson.video_url} />;
                    }
                    
                    // Supabase storage or direct video files - use native video player
                    if (videoType === 'supabase' || videoType === 'direct') {
                      return (
                        <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                          <video 
                            src={activeLesson.video_url}
                            controls 
                            className="w-full h-full"
                            playsInline
                            controlsList="nodownload"
                            preload="metadata"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              // Retry without crossOrigin if CORS fails
                              const video = e.currentTarget;
                              if (video.getAttribute('crossorigin')) {
                                video.removeAttribute('crossorigin');
                                video.load();
                              }
                            }}
                          >
                            Seu navegador não suporta o elemento de vídeo.
                          </video>
                        </div>
                      );
                    }
                    
                    // YouTube, Vimeo, OneDrive and other embeddable sources - use iframe
                    return (
                      <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                        <iframe
                          src={getEmbedUrl(activeLesson.video_url)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  })()
                ) : (
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">{activeLesson?.name}</h2>
                      <p className="text-muted-foreground mt-1">{activeLesson?.description}</p>
                    </div>
                    {activeLesson && activeLesson.content_type !== 'quiz' && (
                      <Button
                        variant={completedLessons.has(activeLesson.id) ? "secondary" : "default"}
                        onClick={() => markLessonComplete(activeLesson.id)}
                        disabled={completedLessons.has(activeLesson.id)}
                      >
                        {completedLessons.has(activeLesson.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluída
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Concluída
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Quiz Section - Show when video lesson has quiz attached */}
                  {activeLesson && activeLesson.content_type === 'video' && activeLesson.quiz_questions && activeLesson.quiz_questions.length > 0 && (
                    <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Prova desta Aula</h4>
                            <p className="text-sm text-muted-foreground">
                              {activeLesson.quiz_questions.length} questões • Mínimo: {activeLesson.quiz_passing_score || 70}%
                              {passedQuizzes.has(activeLesson.id) && (
                                <Badge variant="secondary" className="ml-2 gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  Aprovado: {passedQuizzes.get(activeLesson.id)}%
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {activeLesson.video_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowQuizPlayer(false)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Ver Vídeo
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => setShowQuizPlayer(true)}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            {passedQuizzes.has(activeLesson.id) ? 'Refazer Prova' : 'Fazer Prova'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiple Download Files */}
                  {activeLesson?.download_files && activeLesson.download_files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Materiais para Download:</p>
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.download_files.map((file, index) => (
                          <a 
                            key={index}
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm text-primary transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            {file.name || `Arquivo ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Legacy single file support */}
                  {activeLesson?.file_url && (!activeLesson.download_files || activeLesson.download_files.length === 0) && (
                    <a 
                      href={activeLesson.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Material
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Course Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Conteúdo do Curso
              </CardTitle>
              
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'month')} className="mt-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all" className="text-xs">
                    <List className="h-3 w-3 mr-1" />
                    Completo
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Por Mês
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              {/* Month Selector */}
              {viewMode === 'month' && (
                <div className="mb-4 space-y-3">
                  {/* Access Info */}
                  {!isLifetime && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Você tem acesso a {accessibleMonths} {accessibleMonths === 1 ? 'mês' : 'meses'} de conteúdo
                        {totalContentMonths > accessibleMonths && ` de ${totalContentMonths} disponíveis`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Show available months */}
                    {getAvailableMonths().map((month) => {
                      const monthProgress = getMonthProgress(month);
                      return (
                        <Button
                          key={month}
                          variant={selectedMonth === month ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMonth(month)}
                          className="relative"
                        >
                          Mês {month}
                          {monthProgress === 100 && (
                            <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
                          )}
                        </Button>
                      );
                    })}
                    
                    {/* Show locked months for time-limited products */}
                    {!isLifetime && totalContentMonths > accessibleMonths && 
                      Array.from({ length: totalContentMonths - accessibleMonths }, (_, i) => i + accessibleMonths + 1).map((month) => (
                        <Button
                          key={month}
                          variant="ghost"
                          size="sm"
                          disabled
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Mês {month}
                        </Button>
                      ))
                    }
                  </div>
                  
                  {/* Month Progress */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Progress value={getMonthProgress(selectedMonth)} className="h-1.5 flex-1" />
                    <span>{getMonthProgress(selectedMonth)}%</span>
                  </div>
                </div>
              )}
              
              <Accordion type="multiple" defaultValue={filteredModules.map(m => m.id)} className="space-y-2">
                {filteredModules.map((module, index) => (
                  <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-3">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-left">
                        <span className="font-medium text-sm">{module.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {module.lessons.filter(l => completedLessons.has(l.id)).length}/{module.lessons.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-1">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setActiveLesson(lesson);
                              setShowQuizPlayer(false);
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                              activeLesson?.id === lesson.id 
                                ? 'bg-primary/10 text-primary' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            {completedLessons.has(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : lesson.content_type === 'quiz' ? (
                              <ClipboardList className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <Play className="h-4 w-4 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm truncate">{lesson.name}</p>
                                {lesson.content_type === 'quiz' && passedQuizzes.has(lesson.id) && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1">
                                    {passedQuizzes.get(lesson.id)}%
                                  </Badge>
                                )}
                              </div>
                              {lesson.video_duration && lesson.content_type !== 'quiz' && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(lesson.video_duration)}
                                </p>
                              )}
                              {lesson.content_type === 'quiz' && lesson.quiz_questions && (
                                <p className="text-xs text-muted-foreground">
                                  {lesson.quiz_questions.length} questões
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {filteredModules.length === 0 && viewMode === 'month' && (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum módulo disponível para este mês</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        courseName={course?.name || ''}
        productId={productId || ''}
        userName={userName}
      />
    </div>
  );
};

export default CourseViewer;