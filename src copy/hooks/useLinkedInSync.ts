import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';

interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  profilePictureUrl?: string;
  experiences: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
}

interface LinkedInExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

interface LinkedInEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function useLinkedInSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Parse LinkedIn profile URL to get username
  const extractLinkedInUsername = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/i);
    return match ? match[1] : null;
  };

  // Sleep helper for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Sync with retry logic
  const syncWithRetry = async (username: string, attempt: number = 0): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: {
          url: `https://www.linkedin.com/in/${username}`,
          formats: ['markdown', 'extract'],
          actions: [
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down', amount: 500 }
          ],
          extract: {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Full name of the person' },
                headline: { type: 'string', description: 'Professional headline/title' },
                location: { type: 'string', description: 'Location/city' },
                summary: { type: 'string', description: 'About/summary section' },
                experiences: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company: { type: 'string' },
                      title: { type: 'string' },
                      duration: { type: 'string' },
                      location: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                education: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      institution: { type: 'string' },
                      degree: { type: 'string' },
                      field: { type: 'string' },
                      years: { type: 'string' }
                    }
                  }
                },
                skills: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['name']
            }
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        setRetryCount(attempt + 1);
        await sleep(RETRY_DELAY * (attempt + 1));
        return syncWithRetry(username, attempt + 1);
      }
      throw error;
    }
  };

  // Sync LinkedIn profile data from URL stored in profile
  const syncFromLinkedInUrl = useCallback(async (linkedinUrl: string) => {
    if (!user?.id || !linkedinUrl) {
      setSyncError('URL do LinkedIn não fornecida');
      return null;
    }

    const username = extractLinkedInUsername(linkedinUrl);
    if (!username) {
      setSyncError('URL do LinkedIn inválida');
      toast.error('URL do LinkedIn inválida', {
        description: 'Verifique se a URL está no formato correto: linkedin.com/in/seu-perfil'
      });
      return null;
    }

    setIsSyncing(true);
    setSyncError(null);
    setRetryCount(0);

    try {
      // Use Firecrawl with retry logic
      const data = await syncWithRetry(username);

      if (!data?.extract) {
        throw new Error('Não foi possível extrair dados do perfil');
      }

      const extracted = data.extract as LinkedInProfile;

      // Parse experiences with proper dates
      const experiences: LinkedInExperience[] = (extracted.experiences || []).map((exp: any) => {
        const dates = parseDuration(exp.duration);
        return {
          company: exp.company || '',
          title: exp.title || '',
          location: exp.location || '',
          startDate: dates.start,
          endDate: dates.end,
          description: exp.description || '',
          isCurrent: dates.isCurrent
        };
      });

      // Parse education
      const education: LinkedInEducation[] = (extracted.education || []).map((edu: any) => {
        const years = parseYears(edu.years);
        return {
          institution: edu.institution || '',
          degree: edu.degree || '',
          fieldOfStudy: edu.field || '',
          startDate: years.start,
          endDate: years.end,
          description: ''
        };
      });

      const profileData: LinkedInProfile = {
        name: extracted.name || '',
        headline: extracted.headline || '',
        location: extracted.location || '',
        summary: extracted.summary || '',
        experiences,
        education,
        skills: extracted.skills || []
      };

      // Save to database
      await saveToProfile(profileData);

      setLastSyncedAt(new Date());
      toast.success('Perfil sincronizado!', {
        description: `Dados importados do LinkedIn: ${profileData.experiences.length} experiências, ${profileData.education.length} formações`
      });

      return profileData;
    } catch (error: any) {
      console.error('LinkedIn sync error:', error);
      const errorMessage = error.message || 'Erro ao sincronizar com LinkedIn';
      setSyncError(errorMessage);
      toast.error('Erro na sincronização', { description: errorMessage });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Save LinkedIn data to user profile
  const saveToProfile = async (data: LinkedInProfile) => {
    if (!user?.id) return;

    // Update main profile with additional LinkedIn fields
    await supabase
      .from('profiles')
      .update({
        name: data.name || undefined,
        headline: data.headline || undefined,
        location: data.location || undefined,
        bio: data.summary || undefined,
        linkedin_synced_at: new Date().toISOString(),
        linkedin_profile_data: data as any,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Also update VIP affiliate if exists
    const { data: affiliate } = await supabase
      .from('vip_affiliates')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (affiliate) {
      await supabase
        .from('vip_affiliates')
        .update({
          name: data.name || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliate.id);
    }

    // Clear existing experiences and add new ones from LinkedIn
    await supabase
      .from('profile_experiences')
      .delete()
      .eq('user_id', user.id);

    for (const exp of data.experiences) {
      await supabase
        .from('profile_experiences')
        .insert({
          user_id: user.id,
          company_name: exp.company,
          position: exp.title,
          location: exp.location || '',
          start_date: exp.startDate,
          end_date: exp.endDate || null,
          is_current: exp.isCurrent,
          description: exp.description || ''
        } as any);
    }

    // Clear existing education and add new ones from LinkedIn
    await supabase
      .from('profile_education')
      .delete()
      .eq('user_id', user.id);

    for (const edu of data.education) {
      await supabase
        .from('profile_education')
        .insert({
          user_id: user.id,
          institution_name: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy,
          start_date: edu.startDate || null,
          end_date: edu.endDate || null,
          description: edu.description || ''
        } as any);
    }

    // Save skills from LinkedIn
    await supabase
      .from('profile_skills')
      .delete()
      .eq('user_id', user.id);

    for (const skill of data.skills.slice(0, 20)) {
      await supabase
        .from('profile_skills')
        .insert({
          user_id: user.id,
          skill_name: skill,
          proficiency_level: 'intermediate'
        } as any);
    }

    // Log the sync
    await supabase
      .from('profile_edit_history')
      .insert({
        user_id: user.id,
        field_changed: 'linkedin_sync',
        new_value: JSON.stringify({
          synced_at: new Date().toISOString(),
          experiences: data.experiences.length,
          education: data.education.length,
          skills: data.skills.length
        })
      });
  };

  return {
    syncFromLinkedInUrl,
    isSyncing,
    lastSyncedAt,
    syncError,
    extractLinkedInUsername
  };
}

// Helper to parse LinkedIn duration strings like "Jan 2020 - Present"
function parseDuration(duration?: string): { start: string; end?: string; isCurrent: boolean } {
  if (!duration) return { start: new Date().toISOString().split('T')[0], isCurrent: false };

  const isCurrent = duration.toLowerCase().includes('present') || duration.toLowerCase().includes('atual');
  const parts = duration.split(' - ').map(s => s.trim());

  const parseDate = (str: string): string => {
    const months: Record<string, string> = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
      'feb': '02', 'apr': '04', 'may': '05', 'aug': '08', 'sep': '09', 'oct': '10', 'dec': '12'
    };
    
    const yearMatch = str.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
    
    let month = '01';
    for (const [key, val] of Object.entries(months)) {
      if (str.toLowerCase().includes(key)) {
        month = val;
        break;
      }
    }
    
    return `${year}-${month}-01`;
  };

  return {
    start: parseDate(parts[0]),
    end: parts[1] && !isCurrent ? parseDate(parts[1]) : undefined,
    isCurrent
  };
}

// Helper to parse education years
function parseYears(years?: string): { start?: string; end?: string } {
  if (!years) return {};
  
  const yearMatches = years.match(/\d{4}/g);
  if (!yearMatches) return {};
  
  return {
    start: yearMatches[0] ? `${yearMatches[0]}-01-01` : undefined,
    end: yearMatches[1] ? `${yearMatches[1]}-01-01` : undefined
  };
}
