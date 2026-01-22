import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useRealtimeProfile } from '@/hooks/useRealtimeProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ImageCropper } from '@/components/ui/image-cropper';
import { 
  Camera, Save, Plus, Trash2, Edit, 
  Briefcase, GraduationCap, Award,
  MapPin, Globe, Linkedin, Twitter, Instagram, Youtube,
  Eye, Star, TrendingUp, Users, Coins, Loader2, X
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
}

interface Education {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  endorsements_count: number;
}

const MemberProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, tierInfo, displayName, isLoading: profileLoading, currentTierConfig, refetch } = useRealtimeProfile();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    location: '',
    phone: '',
    websiteUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    isPublic: true,
  });
  
  // Dialog states
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({});
  const [newEducation, setNewEducation] = useState<Partial<Education>>({});
  const [newSkill, setNewSkill] = useState({ skill_name: '', proficiency_level: 'intermediate' });
  
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
    loadExtendedProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        websiteUrl: profile.websiteUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        twitterUrl: profile.twitterUrl || '',
        instagramUrl: profile.instagramUrl || '',
        youtubeUrl: profile.youtubeUrl || '',
        isPublic: profile.isPublic ?? true,
      });
    }
  }, [profile]);

  const loadExtendedProfile = async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error loading extended profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          name: formData.name,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          website_url: formData.websiteUrl,
          linkedin_url: formData.linkedinUrl,
          twitter_url: formData.twitterUrl,
          instagram_url: formData.instagramUrl,
          youtube_url: formData.youtubeUrl,
          is_public: formData.isPublic,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      await refetch();
      toast.success('Perfil salvo com sucesso!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
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

      await supabase
        .from('profiles')
        .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      await refetch();
      setShowAvatarCropper(false);
      toast.success('Foto atualizada!');
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

      await supabase
        .from('profiles')
        .update({ cover_image_url: `${urlData.publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      await refetch();
      setShowCoverCropper(false);
      toast.success('Capa atualizada!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao enviar capa');
    }
  };

  const handleAddExperience = async () => {
    if (!user || !newExperience.company_name || !newExperience.position) return;

    try {
      const { error } = await supabase
        .from('profile_experiences')
        .insert({
          user_id: user.id,
          company_name: newExperience.company_name,
          position: newExperience.position,
          location: newExperience.location || '',
          start_date: newExperience.start_date || new Date().toISOString().split('T')[0],
          end_date: newExperience.end_date || null,
          is_current: newExperience.is_current || false,
          description: newExperience.description || ''
        });

      if (error) throw error;

      toast.success('Experiência adicionada!');
      setNewExperience({});
      setShowExperienceDialog(false);
      loadExtendedProfile();
    } catch (error) {
      console.error('Error adding experience:', error);
      toast.error('Erro ao adicionar experiência');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await supabase.from('profile_experiences').delete().eq('id', id);
      toast.success('Experiência removida!');
      loadExtendedProfile();
    } catch (error) {
      toast.error('Erro ao remover experiência');
    }
  };

  const handleAddEducation = async () => {
    if (!user || !newEducation.institution_name) return;

    try {
      const { error } = await supabase
        .from('profile_education')
        .insert({
          user_id: user.id,
          institution_name: newEducation.institution_name,
          degree: newEducation.degree || '',
          field_of_study: newEducation.field_of_study || '',
          start_date: newEducation.start_date || null,
          end_date: newEducation.end_date || null,
          description: newEducation.description || ''
        });

      if (error) throw error;

      toast.success('Formação adicionada!');
      setNewEducation({});
      setShowEducationDialog(false);
      loadExtendedProfile();
    } catch (error) {
      toast.error('Erro ao adicionar formação');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await supabase.from('profile_education').delete().eq('id', id);
      toast.success('Formação removida!');
      loadExtendedProfile();
    } catch (error) {
      toast.error('Erro ao remover formação');
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
          proficiency_level: newSkill.proficiency_level
        });

      if (error) throw error;

      toast.success('Habilidade adicionada!');
      setNewSkill({ skill_name: '', proficiency_level: 'intermediate' });
      setShowSkillDialog(false);
      loadExtendedProfile();
    } catch (error) {
      toast.error('Erro ao adicionar habilidade');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await supabase.from('profile_skills').delete().eq('id', id);
      toast.success('Habilidade removida!');
      loadExtendedProfile();
    } catch (error) {
      toast.error('Erro ao remover habilidade');
    }
  };

  // Calculate tier progress
  const tierProgress = {
    bronze: { min: 0, max: 500, next: 'silver' },
    silver: { min: 500, max: 2000, next: 'gold' },
    gold: { min: 2000, max: 5000, next: 'platinum' },
    platinum: { min: 5000, max: 15000, next: 'diamond' },
    diamond: { min: 15000, max: 999999, next: null },
  };

  const currentProgress = tierProgress[tierInfo.tier as keyof typeof tierProgress] || tierProgress.bronze;
  const progressPercent = Math.min(100, ((tierInfo.totalPoints - currentProgress.min) / (currentProgress.max - currentProgress.min)) * 100);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="flex gap-4 -mt-12 px-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2 pt-12">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Cover Image */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-48 md:h-56 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg overflow-hidden"
      >
        {profile.coverImageUrl && (
          <img 
            src={profile.coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
      </motion.div>

      {/* Profile Header */}
      <div className="relative px-4 md:px-6 -mt-16">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatarUrl || ''} alt={displayName} />
              <AvatarFallback className="text-3xl bg-primary/10">
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full h-10 w-10"
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

          {/* Name and tier badge */}
          <div className="flex-1 space-y-2 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
              <Badge className={`${currentTierConfig.bgColor} ${currentTierConfig.color} border-0`}>
                {currentTierConfig.icon} {currentTierConfig.label}
              </Badge>
            </div>
            {profile.headline && (
              <p className="text-muted-foreground">{profile.headline}</p>
            )}
            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3 pb-4">
            <Card className="p-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-primary">{tierInfo.points}</div>
              <div className="text-xs text-muted-foreground">Pontos</div>
            </Card>
            <Card className="p-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-primary">{profile.profileViews}</div>
              <div className="text-xs text-muted-foreground">Visualizações</div>
            </Card>
            <Card className="p-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-primary">{tierInfo.referralCount}</div>
              <div className="text-xs text-muted-foreground">Indicações</div>
            </Card>
          </div>
        </div>

        {/* Tier Progress */}
        {currentProgress.next && (
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso para {tierProgress[currentProgress.next as keyof typeof tierProgress] ? currentProgress.next.charAt(0).toUpperCase() + currentProgress.next.slice(1) : ''}</span>
              <span className="text-sm text-muted-foreground">
                {tierInfo.totalPoints}/{currentProgress.max} pts
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Faltam {currentProgress.max - tierInfo.totalPoints} pontos para o próximo nível!
            </p>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mt-6">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="experience">Experiência</TabsTrigger>
            <TabsTrigger value="education">Formação</TabsTrigger>
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título/Headline</Label>
                    <Input 
                      value={formData.headline}
                      onChange={(e) => setFormData({...formData, headline: e.target.value})}
                      placeholder="Ex: Desenvolvedor Full Stack"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Conte um pouco sobre você..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Cidade, País"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Redes Sociais</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Website
                      </Label>
                      <Input 
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                        placeholder="https://"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </Label>
                      <Input 
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                        placeholder="URL do LinkedIn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" /> Twitter
                      </Label>
                      <Input 
                        value={formData.twitterUrl}
                        onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
                        placeholder="URL do Twitter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" /> Instagram
                      </Label>
                      <Input 
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                        placeholder="URL do Instagram"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Perfil Público</p>
                    <p className="text-sm text-muted-foreground">
                      Permitir que outros vejam seu perfil
                    </p>
                  </div>
                  <Switch 
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Experiências Profissionais</h3>
              <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Experiência</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Empresa*</Label>
                      <Input 
                        value={newExperience.company_name || ''}
                        onChange={(e) => setNewExperience({...newExperience, company_name: e.target.value})}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo*</Label>
                      <Input 
                        value={newExperience.position || ''}
                        onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
                        placeholder="Seu cargo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Input 
                          type="date"
                          value={newExperience.start_date || ''}
                          onChange={(e) => setNewExperience({...newExperience, start_date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Input 
                          type="date"
                          value={newExperience.end_date || ''}
                          onChange={(e) => setNewExperience({...newExperience, end_date: e.target.value})}
                          disabled={newExperience.is_current}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newExperience.is_current || false}
                        onCheckedChange={(checked) => setNewExperience({...newExperience, is_current: checked, end_date: checked ? null : newExperience.end_date})}
                      />
                      <Label>Trabalho atual</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea 
                        value={newExperience.description || ''}
                        onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                        placeholder="Descreva suas responsabilidades..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowExperienceDialog(false)}>Cancelar</Button>
                    <Button onClick={handleAddExperience}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {experiences.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma experiência adicionada</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <Card key={exp.id} className="p-4">
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.start_date} - {exp.is_current ? 'Presente' : exp.end_date}
                          </p>
                          {exp.description && (
                            <p className="text-sm mt-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteExperience(exp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Formação Acadêmica</h3>
              <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Formação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Instituição*</Label>
                      <Input 
                        value={newEducation.institution_name || ''}
                        onChange={(e) => setNewEducation({...newEducation, institution_name: e.target.value})}
                        placeholder="Nome da instituição"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grau</Label>
                      <Input 
                        value={newEducation.degree || ''}
                        onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                        placeholder="Ex: Bacharelado, Mestrado..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Área de Estudo</Label>
                      <Input 
                        value={newEducation.field_of_study || ''}
                        onChange={(e) => setNewEducation({...newEducation, field_of_study: e.target.value})}
                        placeholder="Ex: Ciência da Computação"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input 
                          type="date"
                          value={newEducation.start_date || ''}
                          onChange={(e) => setNewEducation({...newEducation, start_date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Conclusão</Label>
                        <Input 
                          type="date"
                          value={newEducation.end_date || ''}
                          onChange={(e) => setNewEducation({...newEducation, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEducationDialog(false)}>Cancelar</Button>
                    <Button onClick={handleAddEducation}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {education.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma formação adicionada</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {education.map((edu) => (
                  <Card key={edu.id} className="p-4">
                    <div className="flex justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{edu.institution_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {edu.degree} {edu.field_of_study && `em ${edu.field_of_study}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {edu.start_date} - {edu.end_date || 'Presente'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEducation(edu.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Habilidades</h3>
              <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
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
                      <Label>Habilidade*</Label>
                      <Input 
                        value={newSkill.skill_name}
                        onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                        placeholder="Ex: React, Python, Marketing..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSkillDialog(false)}>Cancelar</Button>
                    <Button onClick={handleAddSkill}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {skills.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma habilidade adicionada</p>
              </Card>
            ) : (
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge 
                      key={skill.id} 
                      variant="secondary"
                      className="flex items-center gap-2 py-2 px-3"
                    >
                      {skill.skill_name}
                      <button onClick={() => handleDeleteSkill(skill.id)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Croppers */}
      <ImageCropper
        open={showAvatarCropper}
        onClose={() => setShowAvatarCropper(false)}
        onCropComplete={handleAvatarCropComplete}
        imageSrc={avatarImageSrc}
        aspect={1}
        circularCrop
        title="Cortar Foto de Perfil"
      />

      <ImageCropper
        open={showCoverCropper}
        onClose={() => setShowCoverCropper(false)}
        onCropComplete={handleCoverCropComplete}
        imageSrc={coverImageSrc}
        aspect={16/9}
        title="Cortar Imagem de Capa"
      />
    </div>
  );
};

export default MemberProfile;