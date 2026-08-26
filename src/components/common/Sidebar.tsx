import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  RotateCcw,
  GraduationCap,
  Calendar,
  Sparkles,
  Settings,
  Plus,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export type NavigationTab =
  | 'dashboard'
  | 'mistakes'
  | 'academics'
  | 'review'
  | 'exams'
  | 'calendar'
  | 'insights'
  | 'settings';

interface SidebarProps {
  activeTab?: NavigationTab;
  currentTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
  onSelectTab?: (tab: NavigationTab) => void;
  onOpenNewMistake?: () => void;
  onOpenCommandPalette?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onTabChange,
  onSelectTab,
  onOpenNewMistake,
  onOpenCommandPalette,
}) => {
  const { mistakes, recurringPatterns } = useAcademic();

  const selected = activeTab || currentTab || 'dashboard';
  const handleSelect = (tab: NavigationTab) => {
    if (onTabChange) onTabChange(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const unresolvedCount = mistakes.filter((m) => m.status === 'Unresolved').length;
  const critical3xCount = recurringPatterns.filter((p) => p.isRepeatedAlert && !p.resolved).length;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number; alertBadge?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 stroke-[2.2]" /> },
    {
      id: 'mistakes',
      label: 'Mistakes',
      icon: <BookOpen className="w-4 h-4 stroke-[2.2]" />,
      badge: unresolvedCount > 0 ? unresolvedCount : undefined,
    },
    { id: 'academics', label: 'Academics', icon: <FolderTree className="w-4 h-4 stroke-[2.2]" /> },
    { id: 'review', label: 'Review', icon: <RotateCcw className="w-4 h-4 stroke-[2.2]" /> },
    { id: 'exams', label: 'Exams', icon: <GraduationCap className="w-4 h-4 stroke-[2.2]" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4 stroke-[2.2]" /> },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: <Sparkles className="w-4 h-4 stroke-[2.2]" />,
      badge: critical3xCount > 0 ? critical3xCount : undefined,
      alertBadge: critical3xCount > 0,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between select-none h-screen sticky top-0 z-20 transition-colors">
      {/* Brand Header */}
      <div>
        <div className="p-4 pb-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center shadow-xs">
              <span className="font-mono text-sm font-black text-white dark:text-zinc-950 tracking-wider">R</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight font-display text-zinc-950 dark:text-white">RECALL</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 font-mono font-bold border border-zinc-300 dark:border-zinc-700">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-tight">Academic Intelligence</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 space-y-2">
          <button
            id="sidebar-add-mistake-btn"
            onClick={onOpenNewMistake}
            className="w-full group flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" />
            <span className="tracking-wide">RECORD MISTAKE</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 mt-1">
          <div className="px-2 py-1 text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = selected === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 dark:text-zinc-500'}>{item.icon}</span>
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      item.alertBadge
                        ? isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : isActive
                        ? 'bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {critical3xCount > 0 && (
          <div
            onClick={() => handleSelect('insights')}
            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />
              <span>{critical3xCount} Critical Alert{critical3xCount > 1 ? 's' : ''}</span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 leading-snug font-medium">
              Mistakes repeated 3× need immediate active recall review.
            </p>
          </div>
        )}

        {/* Attribution Notice */}
        <div className="pt-2 px-1 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans font-medium tracking-tight">
            Developed by <span className="text-zinc-800 dark:text-zinc-300 font-bold">BlazeSerpent.co</span> × <span className="text-zinc-800 dark:text-zinc-300 font-bold">Aryan</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
