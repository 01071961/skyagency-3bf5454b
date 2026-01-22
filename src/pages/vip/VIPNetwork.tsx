import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VIPHeader } from '@/components/vip/social/VIPHeader';
import { VIPSidebar } from '@/components/vip/social/VIPSidebar';
import { VIPRightSidebar } from '@/components/vip/social/VIPRightSidebar';
import { CreatePostButton } from '@/components/vip/social/CreatePostButton';
import { useAuth } from '@/auth';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Import all network pages
import VIPNetworkHome from './network/VIPNetworkHome';
import VIPNetworkExplore from './network/VIPNetworkExplore';
import VIPNetworkShorts from './network/VIPNetworkShorts';
import VIPNetworkLives from './network/VIPNetworkLives';
import VIPNetworkLive from './network/VIPNetworkLive';
import VIPNetworkLibrary from './network/VIPNetworkLibrary';
import VIPNetworkHistory from './network/VIPNetworkHistory';
import VIPNetworkPlaylists from './network/VIPNetworkPlaylists';
import VIPNetworkLiked from './network/VIPNetworkLiked';
import VIPNetworkSaved from './network/VIPNetworkSaved';
import VIPNetworkTrending from './network/VIPNetworkTrending';
import VIPNetworkPopular from './network/VIPNetworkPopular';
import VIPNetworkMusic from './network/VIPNetworkMusic';
import VIPNetworkGames from './network/VIPNetworkGames';
import VIPNetworkSports from './network/VIPNetworkSports';
import VIPNetworkEducation from './network/VIPNetworkEducation';
import VIPNetworkNews from './network/VIPNetworkNews';
import VIPNetworkSettings from './network/VIPNetworkSettings';
import VIPNetworkFollowing from './network/VIPNetworkFollowing';

export default function VIPNetwork() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const path = location.pathname;
  const isVIP = true;

  // Determine which page to render based on route
  const renderContent = () => {
    if (path.includes('/network/explore')) return <VIPNetworkExplore />;
    if (path.includes('/network/shorts')) return <VIPNetworkShorts />;
    if (path.includes('/network/lives')) return <VIPNetworkLives />;
    if (path.includes('/network/live')) return <VIPNetworkLive />;
    if (path.includes('/network/library')) return <VIPNetworkLibrary />;
    if (path.includes('/network/history')) return <VIPNetworkHistory />;
    if (path.includes('/network/playlists')) return <VIPNetworkPlaylists />;
    if (path.includes('/network/liked')) return <VIPNetworkLiked />;
    if (path.includes('/network/saved')) return <VIPNetworkSaved />;
    if (path.includes('/network/trending')) return <VIPNetworkTrending />;
    if (path.includes('/network/popular')) return <VIPNetworkPopular />;
    if (path.includes('/network/music')) return <VIPNetworkMusic />;
    if (path.includes('/network/games')) return <VIPNetworkGames />;
    if (path.includes('/network/sports')) return <VIPNetworkSports />;
    if (path.includes('/network/education')) return <VIPNetworkEducation />;
    if (path.includes('/network/news')) return <VIPNetworkNews />;
    if (path.includes('/network/settings')) return <VIPNetworkSettings />;
    if (path.includes('/network/following')) return <VIPNetworkFollowing />;
    return <VIPNetworkHome />;
  };

  // Get active tab based on route
  const getActiveTab = () => {
    if (path.includes('/network/following')) return 'following';
    if (path.includes('/network/shorts')) return 'shorts';
    if (path.includes('/network/live')) return 'live';
    return 'all';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'following':
        navigate('/vip/network/following');
        break;
      case 'shorts':
        navigate('/vip/network/shorts');
        break;
      case 'live':
        navigate('/vip/network/live');
        break;
      default:
        navigate('/vip/network');
    }
  };

  // Show tabs only on main feed pages
  const showTabs = !path.includes('/network/explore') && 
                   !path.includes('/network/lives') &&
                   !path.includes('/network/library') &&
                   !path.includes('/network/history') &&
                   !path.includes('/network/playlists') &&
                   !path.includes('/network/liked') &&
                   !path.includes('/network/saved') &&
                   !path.includes('/network/trending') &&
                   !path.includes('/network/popular') &&
                   !path.includes('/network/music') &&
                   !path.includes('/network/games') &&
                   !path.includes('/network/sports') &&
                   !path.includes('/network/education') &&
                   !path.includes('/network/news') &&
                   !path.includes('/network/settings');

  return (
    <div className="min-h-screen bg-background">
      <VIPHeader 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <VIPSidebar collapsed={sidebarCollapsed} />

      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'ml-[72px]' : 'ml-60'
      )}>
        <div className="flex max-w-[1920px] mx-auto">
          <div className="flex-1 p-6">
            {showTabs && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-bold mb-2">Para Você</h1>
                <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="all">Tudo</TabsTrigger>
                    <TabsTrigger value="following">Seguindo</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="live" className="gap-2">
                      Ao Vivo
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </motion.div>
            )}
            
            {renderContent()}
          </div>

          <VIPRightSidebar />
        </div>
      </main>

      <CreatePostButton />
    </div>
  );
}
