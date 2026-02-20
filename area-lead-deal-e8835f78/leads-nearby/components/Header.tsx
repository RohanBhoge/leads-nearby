import React, { useState } from 'react';
import { Navigation, Menu, UserCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 md:px-12 py-6 bg-white dark:bg-slate-900 z-50 w-full max-w-7xl mx-auto relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
          <Navigation className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leads Nearby</h1>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">Home</a>
        <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">My Jobs</a>
        <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">Messages</a>
        <a className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">
          <UserCircle className="w-5 h-5" />
          Profile
        </a>
      </nav>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
      </button>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-4 md:hidden shadow-xl z-50">
           <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300" href="#">Home</a>
            <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300" href="#">My Jobs</a>
            <a className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300" href="#">Messages</a>
            <a className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300" href="#">
              <UserCircle className="w-5 h-5" />
              Profile
            </a>
        </div>
      )}
    </header>
  );
};