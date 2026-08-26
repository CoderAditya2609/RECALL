import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Download,
} from 'lucide-react';
import { CalendarEvent, Exam, Mistake } from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface AcademicCalendarViewProps {
  onSelectExam: (exam: Exam) => void;
  onStartRevision: (mistakes?: Mistake[]) => void;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  onSelectExam,
  onStartRevision,
}) => {
  const { calendarEvents, exams, addCalendarEvent } = useAcademic();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // New Event Form
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('06:00 PM');
  const [eventType, setEventType] = useState<CalendarEvent['type']>('revision_session');
  const [subject, setSubject] = useState('Chemistry');
  const [notes, setNotes] = useState('');

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addCalendarEvent({
      title: title.trim(),
      date: eventDate,
      time,
      type: eventType,
      subject,
      notes: notes.trim(),
      completed: false,
    });

    setTitle('');
    setIsAddingEvent(false);
  };

  const exportToICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RECALL//Academic Calendar//EN\n`;
    calendarEvents.forEach((ev) => {
      const cleanDate = ev.date.replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART;VALUE=DATE:${cleanDate}\nDESCRIPTION:${ev.notes || ev.type}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recall-academic-schedule-${year}-${month + 1}.ics`;
    link.click();
  };

  // Days grid
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const getEventsForDay = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter((ev) => ev.date === formattedDate);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[2.5]" />
            <span>Academic Events & Revision Calendar</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Dedicated academic calendar for test dates, exams, and targeted active recall revision sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToICS}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-bold transition-colors font-mono"
            title="Download .ics file to import into Google Calendar or Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT ICAL</span>
          </button>
          <button
            onClick={() => setIsAddingEvent(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-colors font-mono"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>SCHEDULE EVENT</span>
          </button>
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddingEvent && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 p-6 rounded-2xl space-y-4 animate-in fade-in shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Schedule Academic Event / Revision Session
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Structure of Atom Active Recall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400"
              >
                <option value="revision_session">Revision Session</option>
                <option value="exam">Official Exam</option>
                <option value="test">Mock Test</option>
                <option value="review_reminder">Review Reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                Time / Slot
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 06:00 PM"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Notes & Specific Topics to Target
            </label>
            <input
              type="text"
              placeholder="e.g. Re-solve 3x repeated quantum number mistakes from notebook"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-400 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold font-mono"
            >
              Add Event
            </button>
          </div>
        </form>
      )}

      {/* Main Calendar Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
        {/* Month Navigation */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
            >
              TODAY
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-center text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 py-2.5 uppercase">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-200 dark:bg-zinc-800">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-28 bg-zinc-50/60 dark:bg-zinc-900/60" />;
            }

            const events = getEventsForDay(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${day}`}
                className={`h-28 p-2 overflow-y-auto transition-colors flex flex-col justify-between ${
                  isToday
                    ? 'bg-zinc-100/70 dark:bg-zinc-800/80'
                    : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                      isToday
                        ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-black'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {day}
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-20">
                  {events.map((ev) => {
                    const isExam = ev.type === 'exam';
                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.relatedExamId) {
                            const foundExam = exams.find((e) => e.id === ev.relatedExamId);
                            if (foundExam) onSelectExam(foundExam);
                          } else {
                            setSelectedEvent(ev);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[10px] truncate cursor-pointer transition-colors font-bold border font-mono ${
                          isExam
                            ? 'bg-zinc-950 dark:bg-zinc-100 border-zinc-950 dark:border-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                        title={ev.title}
                      >
                        <span>{ev.time ? `${ev.time} ` : ''}</span>
                        <span>{ev.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Popup / Details */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl animate-in zoom-in-95 transition-colors">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 uppercase">
                {selectedEvent.type.replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-zinc-950 dark:text-zinc-50 font-display uppercase tracking-tight">{selectedEvent.title}</h3>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                Date: {selectedEvent.date} {selectedEvent.time ? `• ${selectedEvent.time}` : ''}
              </p>
            </div>

            {selectedEvent.notes && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 font-sans font-medium">
                {selectedEvent.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3.5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  onStartRevision();
                }}
                className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>START REVIEW</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
