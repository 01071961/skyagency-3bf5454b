import { motion } from 'framer-motion';
import { Settings, Bell, Lock, Eye, Palette, Globe, Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const settingsSections = [
  {
    title: 'Notificações',
    icon: Bell,
    settings: [
      { id: 'new_follower', label: 'Novos seguidores', description: 'Receber notificação quando alguém te seguir' },
      { id: 'new_comment', label: 'Comentários', description: 'Receber notificação de novos comentários' },
      { id: 'live_start', label: 'Lives', description: 'Notificar quando quem você segue iniciar uma live' },
      { id: 'mentions', label: 'Menções', description: 'Notificar quando você for mencionado' },
    ]
  },
  {
    title: 'Privacidade',
    icon: Lock,
    settings: [
      { id: 'private_profile', label: 'Perfil privado', description: 'Apenas seguidores podem ver seu conteúdo' },
      { id: 'hide_online', label: 'Ocultar status online', description: 'Não mostrar quando você está online' },
      { id: 'hide_likes', label: 'Ocultar curtidas', description: 'Não mostrar vídeos que você curtiu' },
    ]
  },
  {
    title: 'Exibição',
    icon: Eye,
    settings: [
      { id: 'autoplay', label: 'Reprodução automática', description: 'Reproduzir vídeos automaticamente' },
      { id: 'hd_default', label: 'HD por padrão', description: 'Sempre usar qualidade HD quando disponível' },
      { id: 'subtitles', label: 'Legendas automáticas', description: 'Ativar legendas automaticamente' },
    ]
  },
];

export default function VIPNetworkSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500/20 to-slate-500/20">
          <Settings className="h-6 w-6 text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências da rede social</p>
        </div>
      </div>

      {settingsSections.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting, index) => (
                  <div key={setting.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={setting.id} className="text-base font-medium">
                          {setting.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch id={setting.id} />
                    </div>
                    {index < section.settings.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Limpar histórico</p>
              <p className="text-sm text-muted-foreground">Remover todo o histórico de visualização</p>
            </div>
            <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
              Limpar
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desativar conta</p>
              <p className="text-sm text-muted-foreground">Temporariamente desativar sua conta</p>
            </div>
            <Button variant="destructive">
              Desativar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
