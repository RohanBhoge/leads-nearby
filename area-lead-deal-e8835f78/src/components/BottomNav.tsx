import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, User, MessageCircle, Navigation, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch total unread message count
  const fetchUnreadCount = async () => {
    if (!user) return;

    // Get all conversations the user is in
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      setUnreadCount(0);
      return;
    }

    let total = 0;
    for (const part of participations) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', part.conversation_id)
        .neq('sender_id', user.id)
        .gt('created_at', part.last_read_at || '1970-01-01');

      total += count || 0;
    }
    setUnreadCount(total);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  // Reset badge when navigating to messages
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Live subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('nav-unread-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== user.id && location.pathname !== '/messages') {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, location.pathname]);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'home' },
    { path: '/history', icon: History, label: 'history' },
    { path: '/community', icon: MessageCircle, label: 'community' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
    { path: '/profile', icon: User, label: 'profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-60 bg-card/95 backdrop-blur-lg border-r border-border flex-col">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0 hover:bg-muted transition-colors">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Navigation size={18} className="text-primary-foreground fill-current" />
          </div>
          <span className="text-lg font-bold text-foreground">Leads Nearby</span>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 p-3 pt-4">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {/* Icon with badge */}
                <div className="relative shrink-0">
                  <Icon
                    size={20}
                    className={cn("transition-transform duration-200", isActive && "scale-110")}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-[3px] shadow-sm">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span>{t(label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© Leads Nearby</p>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <Icon
                    size={24}
                    className={cn("transition-transform duration-200", isActive && "scale-110")}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-[3px] shadow-sm">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{t(label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
