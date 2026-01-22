import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useLinkedInSync } from '@/hooks/useLinkedInSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ImageCropper } from '@/components/ui/image-cropper';
import { 
  ArrowLeft, Camera, Save, Plus, Trash2, Edit, 
  Briefcase, GraduationCap, Award, Link as LinkIcon,
  MapPin, Globe, Linkedin, Twitter, Instagram, Youtube,
  Eye, EyeOff, History, User, Building, Calendar, Crop,
  RefreshCw, Loader2
} from 'lucide-react';

interface Experience {
  id: string;
  company_name: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  company_logo_url: string;
}

interface Education {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  grade: string;
  description: string;
  institution_logo_url: string;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  endorsements_count: number;
}

interface Profile {
  name: string;
  email: string;
  bio: string;
  headline: string;
  location: string;
  website_url: string;
  linkedin_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  phone: string;
  avatar_url: string;
  cover_image_url: string;
  is_public: boolean;
  profile_views: number;
}

const VIPProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    bio: '',
    headline: '',
    location: '',
    website_url: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    phone: '',
    avatar_url: '',
    cover_image_url: '',
    is_public: true,
    profile_views: 0
  });
  
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({});
  const [newEducation, setNewEducation] = useState<Partial<Education>>({});
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({});
  
  // Image cropper state
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string>('');
  const [coverImageSrc, setCoverImageSrc] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.name || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          headline: profileData.headline || '',
          location: profileData.location || '',
          website_url: profileData.website_url || '',
          linkedin_url: profileData.linkedin_url || '',
          twitter_url: profileData.twitter_url || '',
          instagram_url: profileData.instagram_url || '',
          youtube_url: profileData.youtube_url || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || '',
          cover_image_url: profileData.cover_image_url || '',
          is_public: profileData.is_public ?? true,
          profile_views: profileData.profile_views || 0
        });
      }

      // Load experiences
      const { data: expData } = await supabase
        .from('profile_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (expData) setExperiences(expData);

      // Load education
      const { data: eduData } = await supabase
        .from('profile_education')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (eduData) setEducation(eduData);

      // Load skills
      const { data: skillsData } = await supabase
        .from('profile_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('endorsements_count', { ascending: false });
      
      if (skillsData) setSkills(skillsData);

      // Load edit history
      const { data: historyData } = await supabase
        .from('profile_edit_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false })
        .limit(20);
      
      if (historyData) setEditHistory(historyData);

    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Upsert para garantir que o perfil seja criado ou atualizado
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email || profile.email,
          name: profile.name,
          bio: profile.bio,
          headline: profile.headline,
          location: profile.location,
          website_url: profile.website_url,
          linkedin_url: profile.linkedin_url,
          twitter_url: profile.twitter_url,
          instagram_url: profile.instagram_url,
          youtube_url: profile.youtube_url,
          phone: profile.phone,
          is_public: profile.is_public,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Registrar no histórico de edições
      await supabase.from('profile_edit_history').insert({
        user_id: user.id,
        field_changed: 'profile_data',
        old_value: null,
        new_value: JSON.stringify({
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio?.substring(0, 100)
        })
      }).then(() => {});

      toast.success('Perfil salvo com sucesso!', {
        description: 'Suas alterações foram aplicadas.'
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil', {
        description: error.message || 'Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarImageSrc(reader.result as string);
      setShowAvatarCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    try {
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('affiliate-files')
        .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('affiliate-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: `${urlData.publicUrl}?t=${Date.now()}` }));
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    }
  };

  const handleCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageSrc(reader.result as string);
      setShowCoverCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    try {
      const filePath = `${user.id}/cover.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('affiliate-files')
        .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('affiliate-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: `${urlData.publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, cover_image_url: `${urlData.publicUrl}?t=${Date.now()}` }));
      toast.success('Capa atualizada!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao enviar capa');
    }
  };

  const handleAddExperience = async () => {
    if (!user || !newExperience.company_name || !newExperience.position || !newExperience.start_date) return;

    try {
      const { error } = await supabase
        .from('profile_experiences')
        .insert({
          user_id: user.id,
          company_name: newExperience.company_name,
          position: newExperience.position,
          location: newExperience.location || '',
          start_date: newExperience.start_date,
          end_date: newExperience.end_date || null,
          is_current: newExperience.is_current || false,
          description: newExperience.description || ''
        });

      if (error) throw error;

      toast.success('Experiência adicionada!');
      setNewExperience({});
      setShowExperienceDialog(false);
      loadProfile();
    } catch (error) {
      console.error('Error adding experience:', error);
      toast.error('Erro ao adicionar experiência');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Deseja excluir esta experiência?')) return;

    try {
      const { error } = await supabase
        .from('profile_experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Experiência excluída!');
      loadProfile();
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Erro ao excluir experiência');
    }
  };

  const handleAddEducation = async () => {
    if (!user || !newEducation.institution_name || !newEducation.degree) return;

    try {
      const { error } = await supabase
        .from('profile_education')
        .insert({
          user_id: user.id,
          institution_name: newEducation.institution_name,
          degree: newEducation.degree,
          field_of_study: newEducation.field_of_study || '',
          start_date: newEducation.start_date || null,
          end_date: newEducation.end_date || null,
          description: newEducation.description || ''
        });

      if (error) throw error;

      toast.success('Formação adicionada!');
      setNewEducation({});
      setShowEducationDialog(false);
      loadProfile();
    } catch (error) {
      console.error('Error adding education:', error);
      toast.error('Erro ao adicionar formação');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Deseja excluir esta formação?')) return;

    try {
      const { error } = await supabase
        .from('profile_education')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Formação excluída!');
      loadProfile();
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Erro ao excluir formação');
    }
  };

  const handleAddSkill = async () => {
    if (!user || !newSkill.skill_name) return;

    try {
      const { error } = await supabase
        .from('profile_skills')
        .insert({
          user_id: user.id,
          skill_name: newSkill.skill_name,
          proficiency_level: newSkill.proficiency_level || 'intermediate'
        });

      if (error) throw error;

      toast.success('Habilidade adicionada!');
      setNewSkill({});
      setShowSkillDialog(false);
      loadProfile();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Erro ao adicionar habilidade');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Habilidade removida!');
      loadProfile();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Erro ao remover habilidade');
    }
  };

  // LinkedIn Sync Card Component
  const LinkedInSyncCard = ({ linkedinUrl, onSyncComplete }: { linkedinUrl: string; onSyncComplete: () => void }) => {
    const { syncFromLinkedInUrl, isSyncing, lastSyncedAt, extractLinkedInUsername } = useLinkedInSync();
    const hasValidUrl = !!extractLinkedInUsername(linkedinUrl);

    const handleSync = async () => {
      if (!hasValidUrl) {
        toast.error('URL do LinkedIn inválida', {
          description: 'Preencha sua URL do LinkedIn nas redes sociais abaixo antes de sincronizar.'
        });
        return;
      }
      const result = await syncFromLinkedInUrl(linkedinUrl);
      if (result) {
        onSyncComplete();
      }
    };

    return (
      <Card className={`border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-transparent ${hasValidUrl ? '' : 'opacity-75'}`}>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Linkedin className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                Sincronizar do LinkedIn
                {hasValidUrl && (
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                    Disponível
                  </Badge>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasValidUrl 
                  ? 'Importe experiências, formação e habilidades do seu perfil público' 
                  : 'Adicione sua URL do LinkedIn abaixo para habilitar a sincronização'
                }
              </p>
              {lastSyncedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Última sincronização: {lastSyncedAt.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleSync}
            disabled={isSyncing || !hasValidUrl}
            variant={hasValidUrl ? 'default' : 'secondary'}
            className="gap-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/40">
        {profile.cover_image_url && (
          <img 
            src={profile.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4"
          onClick={() => coverInputRef.current?.click()}
        >
          <Camera className="h-4 w-4 mr-2" />
          Alterar Capa
        </Button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverSelect}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-8">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-4xl">
                {profile.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/vip/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">{profile.name || 'Seu Nome'}</h1>
              {profile.is_public ? (
                <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> Público</Badge>
              ) : (
                <Badge variant="outline"><EyeOff className="h-3 w-3 mr-1" /> Privado</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{profile.headline || 'Adicione um título'}</p>
            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {profile.location}
              </p>
            )}
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="experience">Experiência</TabsTrigger>
            <TabsTrigger value="education">Formação</TabsTrigger>
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título/Cargo</Label>
                    <Input
                      value={profile.headline}
                      onChange={(e) => setProfile(p => ({ ...p, headline: e.target.value }))}
                      placeholder="Ex: Desenvolvedor Full Stack"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Conte um pouco sobre você..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="Cidade, Estado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Perfil Público</p>
                    <p className="text-sm text-muted-foreground">
                      Permitir que outros vejam seu perfil
                    </p>
                  </div>
                  <Switch
                    checked={profile.is_public}
                    onCheckedChange={(checked) => setProfile(p => ({ ...p, is_public: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn Import Section */}
            <LinkedInSyncCard 
              linkedinUrl={profile.linkedin_url}
              onSyncComplete={loadProfile}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Links e Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Website
                    </Label>
                    <Input
                      value={profile.website_url}
                      onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value }))}
                      placeholder="https://seusite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input
                      value={profile.linkedin_url}
                      onChange={(e) => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" /> Twitter
                    </Label>
                    <Input
                      value={profile.twitter_url}
                      onChange={(e) => setProfile(p => ({ ...p, twitter_url: e.target.value }))}
                      placeholder="https://twitter.com/usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      value={profile.instagram_url}
                      onChange={(e) => setProfile(p => ({ ...p, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" /> YouTube
                    </Label>
                    <Input
                      value={profile.youtube_url}
                      onChange={(e) => setProfile(p => ({ ...p, youtube_url: e.target.value }))}
                      placeholder="https://youtube.com/c/canal"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experiência Profissional
              </h2>
              <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Adicionar Experiência</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Empresa *</Label>
                      <Input
                        value={newExperience.company_name || ''}
                        onChange={(e) => setNewExperience(p => ({ ...p, company_name: e.target.value }))}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo *</Label>
                      <Input
                        value={newExperience.position || ''}
                        onChange={(e) => setNewExperience(p => ({ ...p, position: e.target.value }))}
                        placeholder="Ex: Desenvolvedor Senior"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input
                        value={newExperience.location || ''}
                        onChange={(e) => setNewExperience(p => ({ ...p, location: e.target.value }))}
                        placeholder="Cidade, Estado"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Input
                          type="date"
                          value={newExperience.start_date || ''}
                          onChange={(e) => setNewExperience(p => ({ ...p, start_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Input
                          type="date"
                          value={newExperience.end_date || ''}
                          onChange={(e) => setNewExperience(p => ({ ...p, end_date: e.target.value }))}
                          disabled={newExperience.is_current}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newExperience.is_current || false}
                        onCheckedChange={(checked) => setNewExperience(p => ({ 
                          ...p, 
                          is_current: checked,
                          end_date: checked ? null : p.end_date
                        }))}
                      />
                      <Label>Trabalho atual</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={newExperience.description || ''}
                        onChange={(e) => setNewExperience(p => ({ ...p, description: e.target.value }))}
                        placeholder="Descreva suas responsabilidades..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddExperience} className="w-full">
                      Adicionar Experiência
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {experiences.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma experiência adicionada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                              <Building className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{exp.position}</h3>
                              <p className="text-muted-foreground">{exp.company_name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(exp.start_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })}
                                {' - '}
                                {exp.is_current 
                                  ? 'Presente' 
                                  : exp.end_date 
                                    ? new Date(exp.end_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
                                    : 'Presente'
                                }
                              </p>
                              {exp.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {exp.location}
                                </p>
                              )}
                              {exp.description && (
                                <p className="text-sm mt-2">{exp.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExperience(exp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formação Acadêmica
              </h2>
              <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Adicionar Formação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Instituição *</Label>
                      <Input
                        value={newEducation.institution_name || ''}
                        onChange={(e) => setNewEducation(p => ({ ...p, institution_name: e.target.value }))}
                        placeholder="Nome da instituição"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grau *</Label>
                      <Input
                        value={newEducation.degree || ''}
                        onChange={(e) => setNewEducation(p => ({ ...p, degree: e.target.value }))}
                        placeholder="Ex: Bacharelado, Mestrado, MBA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Área de Estudo</Label>
                      <Input
                        value={newEducation.field_of_study || ''}
                        onChange={(e) => setNewEducation(p => ({ ...p, field_of_study: e.target.value }))}
                        placeholder="Ex: Ciência da Computação"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Input
                          type="date"
                          value={newEducation.start_date || ''}
                          onChange={(e) => setNewEducation(p => ({ ...p, start_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Conclusão</Label>
                        <Input
                          type="date"
                          value={newEducation.end_date || ''}
                          onChange={(e) => setNewEducation(p => ({ ...p, end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={newEducation.description || ''}
                        onChange={(e) => setNewEducation(p => ({ ...p, description: e.target.value }))}
                        placeholder="Atividades, honras, etc."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddEducation} className="w-full">
                      Adicionar Formação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {education.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma formação adicionada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {education.map((edu) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                              <GraduationCap className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{edu.institution_name}</h3>
                              <p className="text-muted-foreground">
                                {edu.degree} {edu.field_of_study && `em ${edu.field_of_study}`}
                              </p>
                              {edu.start_date && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(edu.start_date).getFullYear()}
                                  {edu.end_date && ` - ${new Date(edu.end_date).getFullYear()}`}
                                </p>
                              )}
                              {edu.description && (
                                <p className="text-sm mt-2">{edu.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEducation(edu.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                Habilidades
              </h2>
              <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Habilidade</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Habilidade *</Label>
                      <Input
                        value={newSkill.skill_name || ''}
                        onChange={(e) => setNewSkill(p => ({ ...p, skill_name: e.target.value }))}
                        placeholder="Ex: JavaScript, Liderança, Marketing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Proficiência</Label>
                      <Select
                        value={newSkill.proficiency_level || 'intermediate'}
                        onValueChange={(v) => setNewSkill(p => ({ ...p, proficiency_level: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Iniciante</SelectItem>
                          <SelectItem value="intermediate">Intermediário</SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                          <SelectItem value="expert">Especialista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddSkill} className="w-full">
                      Adicionar Habilidade
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {skills.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma habilidade adicionada</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm group cursor-pointer"
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        {skill.skill_name}
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          ({skill.proficiency_level === 'beginner' ? 'Iniciante' :
                            skill.proficiency_level === 'intermediate' ? 'Intermediário' :
                            skill.proficiency_level === 'advanced' ? 'Avançado' : 'Especialista'})
                        </span>
                        <Trash2 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Edições
            </h2>

            {editHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma alteração registrada</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <ScrollArea className="h-[400px]">
                  <CardContent className="p-4 space-y-4">
                    {editHistory.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Edit className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{item.field_changed}</span> foi alterado
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.changed_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </ScrollArea>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Avatar Cropper */}
      <ImageCropper
        open={showAvatarCropper}
        onClose={() => setShowAvatarCropper(false)}
        onCropComplete={handleAvatarCropComplete}
        imageSrc={avatarImageSrc}
        aspect={1}
        circularCrop={true}
        title="Recortar Foto de Perfil"
      />

      {/* Cover Cropper */}
      <ImageCropper
        open={showCoverCropper}
        onClose={() => setShowCoverCropper(false)}
        onCropComplete={handleCoverCropComplete}
        imageSrc={coverImageSrc}
        aspect={3}
        circularCrop={false}
        title="Recortar Imagem de Capa"
      />
    </div>
  );
};

export default VIPProfileEdit;
