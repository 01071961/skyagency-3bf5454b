import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Crown, Edit, Trash2, UserPlus, RefreshCw, 
  Mail, Calendar, MoreVertical, Check, X, Loader2, Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminInvite from './AdminInvite';

type AppRole = 'user' | 'editor' | 'admin' | 'owner';

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email: string | null;
  name: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
  expires_at: string;
  inviter_name: string | null;
  accepted_at: string | null;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Edit; color: string; badgeVariant: 'default' | 'secondary' | 'outline' }> = {
  owner: { label: 'Proprietário', icon: Crown, color: 'text-amber-500', badgeVariant: 'default' },
  admin: { label: 'Administrador', icon: Shield, color: 'text-purple-500', badgeVariant: 'secondary' },
  editor: { label: 'Editor', icon: Edit, color: 'text-blue-500', badgeVariant: 'outline' },
  user: { label: 'Usuário', icon: Users, color: 'text-muted-foreground', badgeVariant: 'outline' },
};

const TeamMembersManager = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState('members');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch team members with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for each user
      const memberPromises = (rolesData || []).map(async (role) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('user_id', role.user_id)
          .single();
        
        return {
          ...role,
          email: profile?.email || null,
          name: profile?.name || null,
        } as TeamMember;
      });

      const membersWithProfiles = await Promise.all(memberPromises);
      setMembers(membersWithProfiles);

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('admin_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvites(invitesData || []);

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Erro ao carregar dados da equipe');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRole = async (memberId: string, userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role } : m
      ));
      setEditingMember(null);
      toast.success('Permissão atualizada com sucesso');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', deletingMember.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== deletingMember.id));
      setDeletingMember(null);
      toast.success('Membro removido da equipe');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('admin_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      setInvites(prev => prev.filter(i => i.id !== inviteId));
      toast.success('Convite cancelado');
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const handleResendInvite = async (invite: PendingInvite) => {
    try {
      const { error } = await supabase.functions.invoke('send-role-invite', {
        body: {
          email: invite.email,
          name: invite.email.split('@')[0],
          role: invite.role,
          inviterName: 'SKY BRASIL'
        },
      });

      if (error) throw error;
      toast.success('Convite reenviado com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error('Erro ao reenviar convite');
    }
  };

  const filteredMembers = members.filter(m => 
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = invites.filter(i =>
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return '?';
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Gerenciar Equipe
          </h2>
          <p className="text-muted-foreground">
            Gerencie membros, permissões e convites
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Membros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Convites ({invites.length})
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Convidar
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="members" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                Lista completa de usuários com permissões no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredMembers.map((member, index) => {
                        const RoleIcon = roleConfig[member.role].icon;
                        const isEditing = editingMember === member.id;
                        
                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${roleConfig[member.role].color} bg-muted`}>
                                  {getInitials(member.name, member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name || 'Sem nome'}</p>
                                <p className="text-sm text-muted-foreground">{member.email || 'Sem email'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={newRole} 
                                    onValueChange={(v) => setNewRole(v as AppRole)}
                                  >
                                    <SelectTrigger className="w-36">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Object.keys(roleConfig) as AppRole[]).map((r) => {
                                        const Icon = roleConfig[r].icon;
                                        return (
                                          <SelectItem key={r} value={r}>
                                            <div className="flex items-center gap-2">
                                              <Icon className={`w-4 h-4 ${roleConfig[r].color}`} />
                                              {roleConfig[r].label}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleUpdateRole(member.id, member.user_id, newRole)}
                                  >
                                    <Check className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => setEditingMember(null)}
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Badge variant={roleConfig[member.role].badgeVariant} className="flex items-center gap-1">
                                    <RoleIcon className={`w-3 h-3 ${roleConfig[member.role].color}`} />
                                    {roleConfig[member.role].label}
                                  </Badge>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setEditingMember(member.id);
                                        setNewRole(member.role);
                                      }}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar permissão
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => setDeletingMember(member)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remover da equipe
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                Convites enviados aguardando aceitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredInvites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum convite pendente
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredInvites.map((invite, index) => {
                      const RoleIcon = roleConfig[invite.role].icon;
                      const expired = isExpired(invite.expires_at);
                      
                      return (
                        <motion.div
                          key={invite.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            expired ? 'bg-destructive/10' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              expired ? 'bg-destructive/20' : 'bg-primary/20'
                            }`}>
                              <Mail className={`w-5 h-5 ${expired ? 'text-destructive' : 'text-primary'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{invite.email}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {expired ? (
                                  <span className="text-destructive">Expirado</span>
                                ) : (
                                  <span>Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant={roleConfig[invite.role].badgeVariant} className="flex items-center gap-1">
                              <RoleIcon className={`w-3 h-3 ${roleConfig[invite.role].color}`} />
                              {roleConfig[invite.role].label}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleResendInvite(invite)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Reenviar convite
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleCancelInvite(invite.id)}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancelar convite
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="mt-0">
          <AdminInvite />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMember && (
                <>
                  Você está prestes a remover <strong>{deletingMember.name || deletingMember.email}</strong> da equipe. 
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamMembersManager;
