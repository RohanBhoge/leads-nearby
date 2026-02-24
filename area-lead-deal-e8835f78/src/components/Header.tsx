import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageToggle from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLanguage?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showLanguage = true,
  rightElement,
  onBack,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack ? onBack() : navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-bold text-foreground truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {showLanguage && <LanguageToggle />}
          {rightElement}
        </div>
      </div>
    </header>
  );
};

export default Header;
