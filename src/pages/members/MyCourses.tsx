import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play,
  Search,
  Filter,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Enrollment {
  id: string;
  product_id: string;
  progress_percent: number;
  enrolled_at: string;
  expires_at: string | null;
  status: string;
  last_accessed_at: string | null;
  product: {
    name: string;
    cover_image_url: string | null;
    slug: string;
    description: string | null;
  };
}

const MyCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  useEffect(() => {
    filterEnrollments();
  }, [enrollments, searchQuery, activeTab]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          progress_percent,
          enrolled_at,
          expires_at,
          status,
          last_accessed_at,
          product:products(name, cover_image_url, slug, description)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('last_accessed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const enrollmentData = (data || []).map(e => ({
        ...e,
        product: Array.isArray(e.product) ? e.product[0] : e.product
      })) as Enrollment[];

      setEnrollments(enrollmentData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = () => {
    let filtered = [...enrollments];

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    if (activeTab === 'in-progress') {
      filtered = filtered.filter(e => e.progress_percent > 0 && e.progress_percent < 100);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(e => e.progress_percent >= 100);
    } else if (activeTab === 'not-started') {
      filtered = filtered.filter(e => e.progress_percent === 0);
    }

    setFilteredEnrollments(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Cursos</h1>
        <p className="text-muted-foreground">Gerencie seus cursos e continue aprendendo</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cursos..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todos ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            Em Andamento ({enrollments.filter(e => e.progress_percent > 0 && e.progress_percent < 100).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({enrollments.filter(e => e.progress_percent >= 100).length})
          </TabsTrigger>
          <TabsTrigger value="not-started">
            Não Iniciados ({enrollments.filter(e => e.progress_percent === 0).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredEnrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {enrollment.product?.cover_image_url ? (
                      <img 
                        src={enrollment.product.cover_image_url} 
                        alt={enrollment.product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {enrollment.progress_percent >= 100 ? (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    ) : enrollment.progress_percent > 0 ? (
                      <Badge className="absolute top-2 right-2 bg-primary">
                        <Clock className="h-3 w-3 mr-1" />
                        {enrollment.progress_percent}%
                      </Badge>
                    ) : (
                      <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground">
                        Novo
                      </Badge>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-4 rounded-full bg-primary text-primary-foreground">
                        <Play className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-1">
                      {enrollment.product?.name || 'Curso'}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {enrollment.product?.description || 'Sem descrição'}
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span className="font-medium">{enrollment.progress_percent || 0}%</span>
                        </div>
                        <Progress value={enrollment.progress_percent || 0} />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Matriculado em {formatDate(enrollment.enrolled_at)}</span>
                        {enrollment.expires_at && (
                          <span>Expira: {formatDate(enrollment.expires_at)}</span>
                        )}
                      </div>
                      
                      <Link to={`/members/courses/${enrollment.product_id}`}>
                        <Button className="w-full" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          {enrollment.progress_percent > 0 ? 'Continuar' : 'Começar'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'Nenhum curso encontrado' : 'Nenhum curso nesta categoria'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Tente buscar por outro termo' 
                    : 'Explore novos cursos para começar a aprender'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyCourses;
