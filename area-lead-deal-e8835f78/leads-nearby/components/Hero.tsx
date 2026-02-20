import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Briefcase } from 'lucide-react';

const TYPING_STRINGS = [
  "Python Tutor",
  "Plumber",
  "Dog Walker",
  "Electrician",
  "House Cleaner",
  "Piano Teacher"
];

export const Hero: React.FC = () => {
  const [currentText, setCurrentText] = useState("");
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const currentString = TYPING_STRINGS[stringIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (charIndex < currentString.length) {
          setCurrentText((prev) => prev + currentString[charIndex]);
          setCharIndex((prev) => prev + 1);
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setCurrentText((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        } else {
          // Finished deleting, move to next string
          setIsDeleting(false);
          setStringIndex((prev) => (prev + 1) % TYPING_STRINGS.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, isPaused, stringIndex]);

  return (
    <div className="flex flex-col items-center justify-center pt-10 pb-16 md:pt-20 md:pb-24 relative z-10 text-center max-w-4xl mx-auto">
      <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight leading-tight">
        Find help for anything, right in your <span className="text-primary-dark dark:text-primary">neighborhood.</span>
      </h2>

      <div className="relative group mb-10 w-full max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="text-primary w-8 h-8" />
        </div>
        <div className="flex items-center w-full h-16 md:h-20 pl-16 pr-6 rounded-2xl bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
          <span className="text-slate-500 dark:text-slate-400 text-xl md:text-2xl w-full overflow-hidden whitespace-nowrap text-left flex items-center">
            I need a...&nbsp;
            <span className="text-slate-800 dark:text-slate-200 font-medium border-r-2 border-primary animate-blink h-8 flex items-center">
                {currentText}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto">
        <button className="flex-1 h-14 md:h-16 bg-primary hover:bg-[#00d600] active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/30 group">
          <PlusCircle className="text-slate-900 w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span className="text-slate-900 font-bold text-lg">Post a Job</span>
        </button>
        <button className="flex-1 h-14 md:h-16 bg-secondary hover:bg-orange-600 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-secondary/30 text-white group">
          <Briefcase className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          <span className="font-bold text-lg">Find Work</span>
        </button>
      </div>
    </div>
  );
};