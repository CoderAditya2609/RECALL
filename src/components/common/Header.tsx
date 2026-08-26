import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, LogIn, Sun, Moon, Trash2, LogOut, User as UserIcon, X, FolderTree, BookOpen } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentTab?: string;
  onOpenNewMistake?: () => void;
  onOpenSettings?: () => void;
  onOpenChapterManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab = 'dashboard', onOpenChapterManager }) => {
  const { isScanning, scanProgress, scanMistakesWithGemini, mistakes, clearAllData } = useAcademic();
  const { user, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Academic Mistake Intelligence';
      case 'mistakes':
        return 'Mistake Notebook & Annotations';
      case 'academics':
        return 'Academic Taxonomy & Topics';
      case 'review':
        return 'Active Recall Review Engine';
      case 'exams':
        return 'Exam Preparation & Post-Exam Reflection';
      case 'calendar':
        return 'Academic Calendar & Milestones';
      case 'insights':
        return 'Gemini Weakness Diagnostics & Patterns';
      case 'settings':
        return 'System Settings & Cloud Sync';
      default:
        return 'RECALL';
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all mistake records and exam data? This cannot be undone.'
      )
    ) {
      await clearAllData();
    }
  };

  const handleGoogleSignInClick = async () => {
    setIsAccountMenuOpen(false);
    await signInWithGoogle();
  };

  const handleSignOutClick = async () => {
    setIsAccountMenuOpen(false);
    await signOut();
  };

  const isGuest = !user || user.isAnonymous;

  return (
    <header className="h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-10 select-none transition-colors">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 tracking-tight font-display flex items-center gap-2">
            <span>{getTabTitle(currentTab)}</span>
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Auth Error Banner if any */}
        {authError && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300">
            <span>{authError}</span>
            <button onClick={clearAuthError} className="hover:opacity-75">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          id="header-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700 stroke-[2.5]" />
          )}
        </button>

        {/* Quick Chapters / Taxonomy Action */}
        {onOpenChapterManager && (
          <button
            type="button"
            onClick={onOpenChapterManager}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-bold transition-colors font-mono"
            title="Curriculum & Chapter Manager"
          >
            <FolderTree className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden md:inline">CHAPTERS</span>
          </button>
        )}

        {/* Clear Data Button (if there is data) */}
        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-colors font-mono"
            title="Clear all recorded data"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">CLEAR ALL</span>
          </button>
        )}

        {/* Scan My Mistakes Primary Action */}
        <button
          id="header-scan-btn"
          disabled={isScanning || mistakes.length === 0}
          onClick={scanMistakesWithGemini}
          className="relative group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-mono"
          title="Analyze mistake history for deep conceptual weaknesses, 3× alerts, and study prescriptions"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin stroke-[2.5]" />
              <span className="font-mono text-[11px] tracking-tight">
                {scanProgress || 'Analyzing...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-100 group-hover:scale-110 transition-transform stroke-[2.5]" />
              <span className="tracking-wide">SCAN MISTAKES</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* User Account Popover */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 font-semibold transition-colors shadow-2xs"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-mono font-bold">
              {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
            </div>
            <span className="truncate max-w-[110px] font-sans">
              {isGuest ? 'Guest' : (user?.displayName || user?.email?.split('@')[0] || 'Student')}
            </span>
          </button>

          {isAccountMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                  {isGuest ? 'Guest Session' : (user?.displayName || 'Student Account')}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  {isGuest ? 'Local cloud sandbox' : (user?.email || 'Authenticated')}
                </p>
              </div>

              <div className="p-2 space-y-1">
                {onOpenChapterManager && (
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenChapterManager();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>MANAGE CHAPTERS</span>
                  </button>
                )}

                {isGuest ? (
                  <button
                    onClick={handleGoogleSignInClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 rounded-lg transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SIGN IN WITH GOOGLE</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSignOutClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>SIGN OUT</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

