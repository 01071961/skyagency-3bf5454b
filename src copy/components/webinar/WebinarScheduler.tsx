import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Clock, 
  Video, 
  Users,
  Link,
  Mail,
  Bell,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WebinarSchedulerProps {
  onSchedule?: (webinar: WebinarData) => void;
}

interface WebinarData {
  title: string;
  description: string;
  date: Date | undefined;
  time: string;
  duration: string;
  maxParticipants: number;
  videoSource: 'youtube' | 'vimeo' | 'custom';
  videoUrl: string;
  enableChat: boolean;
  enableRecording: boolean;
  sendReminders: boolean;
  reminderHours: number;
}

export const WebinarScheduler = ({ onSchedule }: WebinarSchedulerProps) => {
  const [formData, setFormData] = useState<WebinarData>({
    title: '',
    description: '',
    date: undefined,
    time: '19:00',
    duration: '60',
    maxParticipants: 200,
    videoSource: 'youtube',
    videoUrl: '',
    enableChat: true,
    enableRecording: true,
    sendReminders: true,
    reminderHours: 24
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule?.(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Agendar Webinar
        </CardTitle>
        <CardDescription>
          Configure seu webinar ao vivo com chat integrado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Webinar</Label>
              <Input
                id="title"
                placeholder="Ex: Masterclass de Marketing Digital"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o conteúdo do webinar..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Horário</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  className="pl-10"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duração</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Video Source */}
          <div className="space-y-4">
            <div>
              <Label>Fonte do Vídeo</Label>
              <Select
                value={formData.videoSource}
                onValueChange={(value: 'youtube' | 'vimeo' | 'custom') => 
                  setFormData(prev => ({ ...prev, videoSource: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Live</SelectItem>
                  <SelectItem value="vimeo">Vimeo Live</SelectItem>
                  <SelectItem value="custom">URL Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="videoUrl">URL do Stream</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="videoUrl"
                  placeholder="https://youtube.com/embed/..."
                  className="pl-10"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                max={1000}
                className="pl-10"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 200 }))}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Limite de participantes simultâneos
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Opções</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Chat ao Vivo</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir mensagens dos participantes
                </p>
              </div>
              <Switch
                checked={formData.enableChat}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableChat: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gravar Webinar</Label>
                <p className="text-xs text-muted-foreground">
                  Disponibilizar gravação após o evento
                </p>
              </div>
              <Switch
                checked={formData.enableRecording}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableRecording: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembretes Automáticos</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar email de lembrete antes do evento
                </p>
              </div>
              <Switch
                checked={formData.sendReminders}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendReminders: checked }))}
              />
            </div>

            {formData.sendReminders && (
              <div>
                <Label>Enviar lembrete</Label>
                <Select
                  value={formData.reminderHours.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reminderHours: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora antes</SelectItem>
                    <SelectItem value="24">24 horas antes</SelectItem>
                    <SelectItem value="48">48 horas antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Agendar Webinar
            </Button>
            <Button type="button" variant="outline">
              Salvar Rascunho
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WebinarScheduler;
