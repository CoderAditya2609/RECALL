import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { MistakesListView } from './components/mistakes/MistakesListView';
import { AcademicsView } from './components/academics/AcademicsView';
import { ReviewModeView } from './components/review/ReviewModeView';
import { ExamsView } from './components/exams/ExamsView';
import { AcademicCalendarView } from './components/calendar/AcademicCalendarView';
import { InsightsView } from './components/insights/InsightsView';
import { MistakeModal } from './components/mistakes/MistakeModal';
import { ExamDetailModal } from './components/exams/ExamDetailModal';
import { PostExamAnalysisModal } from './components/exams/PostExamAnalysisModal';
import { ChapterManagerModal } from './components/academics/ChapterManagerModal';
import { Mistake, Exam } from './types';

type ActiveNavTab =
  | 'dashboard'
  | 'mistakes'
  | 'academics'
  | 'review'
  | 'exams'
  | 'calendar'
  | 'insights';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mistake Modal State
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | null>(null);

  // Chapter Manager Modal State
  const [isChapterManagerOpen, setIsChapterManagerOpen] = useState(false);

  // Exam Detail / Post-Exam Modals State
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isExamDetailOpen, setIsExamDetailOpen] = useState(false);
  const [isPostAnalysisOpen, setIsPostAnalysisOpen] = useState(false);

  // Review Queue State (for when launching review with targeted list)
  const [targetedReviewList, setTargetedReviewList] = useState<Mistake[] | undefined>(undefined);

  const handleOpenNewMistake = () => {
    setEditingMistake(null);
    setIsMistakeModalOpen(true);
  };

  const handleSelectMistakeToEdit = (mistake: Mistake) => {
    setEditingMistake(mistake);
    setIsMistakeModalOpen(true);
  };

  const handleStartReview = (mistakesToReview?: Mistake[]) => {
    setTargetedReviewList(mistakesToReview);
    setActiveTab('review');
  };

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsExamDetailOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans antialiased selection:bg-zinc-900 selection:text-white transition-colors">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'review') {
            setTargetedReviewList(undefined);
          }
          setActiveTab(tab);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Right Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenNewMistake={handleOpenNewMistake}
          onOpenChapterManager={() => setIsChapterManagerOpen(true)}
          currentTab={activeTab}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewMistake={handleOpenNewMistake}
              onSelectMistake={handleSelectMistakeToEdit}
              onSelectExam={handleSelectExam}
            />
          )}

          {activeTab === 'mistakes' && (
            <MistakesListView
              onOpenNewMistake={handleOpenNewMistake}
              onSelectMistake={handleSelectMistakeToEdit}
              onStartReview={handleStartReview}
            />
          )}

          {activeTab === 'academics' && (
            <AcademicsView
              onSelectMistakeFilter={(subjId, chap, topic) => {
                setActiveTab('mistakes');
              }}
            />
          )}

          {activeTab === 'review' && (
            <ReviewModeView
              initialMistakes={targetedReviewList}
              onFinishReview={() => setActiveTab('mistakes')}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              onStartExamRevision={handleStartReview}
              onOpenNewMistake={handleOpenNewMistake}
            />
          )}

          {activeTab === 'calendar' && (
            <AcademicCalendarView
              onSelectExam={handleSelectExam}
              onStartRevision={handleStartReview}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView
              onStartReview={handleStartReview}
              onSelectMistake={handleSelectMistakeToEdit}
            />
          )}
        </main>
      </div>

      {/* Chapter Manager Modal */}
      <ChapterManagerModal
        isOpen={isChapterManagerOpen}
        onClose={() => setIsChapterManagerOpen(false)}
      />

      {/* Mistake Entry/Edit Modal */}
      <MistakeModal
        isOpen={isMistakeModalOpen}
        onClose={() => setIsMistakeModalOpen(false)}
        initialMistake={editingMistake}
      />

      {/* Exam Details & Post-Exam Reflection Modals */}
      <ExamDetailModal
        exam={selectedExam}
        isOpen={isExamDetailOpen}
        onClose={() => setIsExamDetailOpen(false)}
        onStartExamRevision={handleStartReview}
        onOpenPostExamAnalysis={(exam) => {
          setIsExamDetailOpen(false);
          setSelectedExam(exam);
          setIsPostAnalysisOpen(true);
        }}
      />

      <PostExamAnalysisModal
        exam={selectedExam}
        isOpen={isPostAnalysisOpen}
        onClose={() => setIsPostAnalysisOpen(false)}
        onOpenNewMistake={handleOpenNewMistake}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AcademicProvider>
          <MainLayout />
        </AcademicProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
