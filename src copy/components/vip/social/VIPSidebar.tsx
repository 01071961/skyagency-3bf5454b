import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  PlaySquare,
  Radio,
  ListVideo,
  Users,
  Clock,
  ThumbsUp,
  Bookmark,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  Flame,
  Music,
  Gamepad2,
  Trophy,
  GraduationCap,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
  collapsible?: boolean;
}

const mainItems: SidebarItem[] = [
  { icon: Home, label: 'Início', href: '/vip/network' },
  { icon: Compass, label: 'Explorar', href: '/vip/network/explore' },
  { icon: PlaySquare, label: 'Shorts', href: '/vip/network/shorts' },
  { icon: Radio, label: 'Lives', href: '/vip/network/lives', badge: 'AO VIVO' },
];

const libraryItems: SidebarItem[] = [
  { icon: Clock, label: 'Histórico', href: '/vip/network/history' },
  { icon: ListVideo, label: 'Playlists', href: '/vip/network/playlists' },
  { icon: ThumbsUp, label: 'Vídeos curtidos', href: '/vip/network/liked' },
  { icon: Bookmark, label: 'Salvos', href: '/vip/network/saved' },
];

const exploreItems: SidebarItem[] = [
  { icon: TrendingUp, label: 'Em alta', href: '/vip/network/trending' },
  { icon: Flame, label: 'Populares', href: '/vip/network/popular' },
  { icon: Music, label: 'Música', href: '/vip/network/music' },
  { icon: Gamepad2, label: 'Games', href: '/vip/network/games' },
  { icon: Trophy, label: 'Esportes', href: '/vip/network/sports' },
  { icon: GraduationCap, label: 'Educação', href: '/vip/network/education' },
  { icon: Newspaper, label: 'Notícias', href: '/vip/network/news' },
];

interface FollowingUser {
  id: string;
  name: string;
  avatar: string;
  isLive?: boolean;
}

interface VIPSidebarProps {
  collapsed?: boolean;
  followingUsers?: FollowingUser[];
}

export function VIPSidebar({ collapsed = false, followingUsers = [] }: VIPSidebarProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['library', 'explore'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const renderItem = (item: SidebarItem, index: number) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link key={item.href} to={item.href}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
            'hover:bg-accent/50 cursor-pointer group',
            isActive && 'bg-accent text-primary'
          )}
        >
          <Icon className={cn(
            'h-5 w-5 shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )} />
          {!collapsed && (
            <>
              <span className={cn(
                'text-sm font-medium flex-1',
                isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {item.label}
              </span>
              {item.badge && (
                <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </motion.div>
      </Link>
    );
  };

  const renderSection = (
    title: string,
    items: SidebarItem[],
    sectionKey: string,
    collapsible = true
  ) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <div className="py-2">
        {!collapsed && title && (
          <button
            onClick={() => collapsible && toggleSection(sectionKey)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {title}
            {collapsible && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        <AnimatePresence>
          {(isExpanded || collapsed || !collapsible) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {items.map((item, index) => renderItem(item, index))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <aside className={cn(
      'fixed left-0 top-16 bottom-0 z-40 bg-background border-r border-border transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-60'
    )}>
      <ScrollArea className="h-full py-4">
        {/* Main Navigation */}
        <div className="px-2">
          {mainItems.map((item, index) => renderItem(item, index))}
        </div>

        <Separator className="my-3 mx-2" />

        {/* Library */}
        <div className="px-2">
          {renderSection('Biblioteca', libraryItems, 'library')}
        </div>

        <Separator className="my-3 mx-2" />

        {/* Following */}
        {followingUsers.length > 0 && !collapsed && (
          <>
            <div className="px-2">
              <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                Seguindo
              </div>
              <div className="space-y-1">
                {followingUsers.slice(0, 7).map((user, index) => (
                  <Link key={user.id} to={`/vip/network/profile/${user.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 cursor-pointer group"
                    >
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        {user.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground truncate flex-1">
                        {user.name}
                      </span>
                      {user.isLive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">
                          LIVE
                        </span>
                      )}
                    </motion.div>
                  </Link>
                ))}
              </div>
              {followingUsers.length > 7 && (
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  Ver todos ({followingUsers.length})
                </Button>
              )}
            </div>
            <Separator className="my-3 mx-2" />
          </>
        )}

        {/* Explore Categories */}
        <div className="px-2">
          {renderSection('Explorar', exploreItems, 'explore')}
        </div>

        <Separator className="my-3 mx-2" />

        {/* Settings */}
        <div className="px-2">
          <Link to="/vip/network/settings">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 cursor-pointer group">
              <Settings className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              {!collapsed && (
                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                  Configurações
                </span>
              )}
            </div>
          </Link>
        </div>
      </ScrollArea>
    </aside>
  );
}
