import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, User, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'home' },
    { path: '/history', icon: History, label: 'history' },
    { path: '/community', icon: MessageCircle, label: 'community' },
    { path: '/profile', icon: User, label: 'profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-60 bg-card/95 backdrop-blur-lg border-r border-border flex-col">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0 hover:bg-muted transition-colors">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Home size={18} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Leads Nearby</span>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 p-3 pt-4">
          {navItems.map(({ path, icon: Icon, label }) => {
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
                <Icon
                  size={20}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                <span>{t(label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">© Leads Nearby</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav - visible on mobile, hidden on md+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
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
                <Icon
                  size={24}
                  className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
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
