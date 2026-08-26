import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import {
  Settings,
  Key,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Download,
  RotateCcw,
  Trash2,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, isGuest, publicProfile, userSettings, updateUsername, updateUserSettings, signOut } = useAuth();
  const { mistakes, subjects, exams, recurringPatterns, resetToSampleData, clearAllData } = useAcademic();

  // Username edit
  const [usernameInput, setUsernameInput] = useState(publicProfile?.username || '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gemini BYOK
  const [apiKeyInput, setApiKeyInput] = useState(userSettings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  // Daily target
  const [dailyTarget, setDailyTarget] = useState(userSettings.dailyTargetMistakes || 5);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameSaving(true);
    setUsernameMessage(null);

    const success = await updateUsername(usernameInput);
    setUsernameSaving(false);
    if (success) {
      setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
      setTimeout(() => setUsernameMessage(null), 3000);
    } else {
      setUsernameMessage({ type: 'error', text: 'Failed to update username. Try a different handle.' });
    }
  };

  const handleSaveApiKey = async () => {
    await updateUserSettings({ geminiApiKey: apiKeyInput.trim() });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyStatus({ type: 'error', text: 'Please enter a Gemini API Key first.' });
      return;
    }

    setKeyTesting(true);
    setKeyStatus(null);

    try {
      const res = await fetch('/api/gemini/analyze-mistake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKeyInput.trim(),
        },
        body: JSON.stringify({
          mistake: {
            subjectName: 'Physics',
            chapter: 'Rotational Motion',
            topic: 'Moment of Inertia',
            mistakeType: 'Conceptual',
            whatWentWrong: 'Testing API Key connection.',
          },
        }),
      });

      if (res.ok) {
        setKeyStatus({ type: 'success', text: 'Gemini API Key verified and active!' });
        await updateUserSettings({ geminiApiKey: apiKeyInput.trim() });
      } else {
        setKeyStatus({ type: 'error', text: 'Verification failed. Please check your Gemini API key.' });
      }
    } catch {
      setKeyStatus({ type: 'error', text: 'Network error verifying key.' });
    } finally {
      setKeyTesting(false);
    }
  };

  const handleClearApiKey = async () => {
    setApiKeyInput('');
    await updateUserSettings({ geminiApiKey: '' });
    setKeyStatus({ type: 'info', text: 'API Key removed. Reverting to default engine.' });
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.uid,
        username: publicProfile?.username,
      },
      subjects,
      mistakes,
      exams,
      recurringPatterns,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `recall-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Settings & Intelligence Engine</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage your personal student handle, configure Gemini BYOK (Bring Your Own Key), and export backup archives.
            </p>
          </div>
        </div>
      </div>

      {/* 1. PROFILE & USERNAME CARD */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Account & Study Profile</h2>
          </div>
          {isGuest ? (
            <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
              Guest Account
            </span>
          ) : (
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Authenticated
            </span>
          )}
        </div>

        <form onSubmit={handleSaveUsername} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Public Handle / Username (@)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="your_handle"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={usernameSaving || usernameInput === publicProfile?.username}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                {usernameSaving ? 'Saving...' : 'Update Handle'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Other students can search for your handle to start study chat threads.
            </p>
          </div>

          {usernameMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                usernameMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {usernameMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{usernameMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">User ID</span>
              <span className="text-zinc-300 font-mono text-[11px] truncate block">{user?.uid || 'guest'}</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Display Name</span>
              <span className="text-zinc-300 text-[11px] truncate block">{user?.displayName || 'Guest Student'}</span>
            </div>
          </div>
        </form>
      </div>

      {/* 2. GEMINI BYOK (BRING YOUR OWN KEY) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Gemini AI BYOK (Bring Your Own Key)
            </h2>
          </div>
          <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Private & Encrypted</span>
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Provide your own Google Gemini API key to power custom AI diagnostics, deep root cause synthesis, and exam prep briefs. Your key is stored strictly inside your private Firestore user profile and never shared.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {keyStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                keyStatus.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : keyStatus.type === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {keyStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{keyStatus.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={keyTesting || !apiKeyInput.trim()}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {keyTesting ? 'Testing Key...' : 'Validate Key'}
            </button>

            <button
              type="button"
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{keySaved ? 'Saved!' : 'Save Key'}</span>
            </button>

            {apiKeyInput && (
              <button
                type="button"
                onClick={handleClearApiKey}
                className="px-3 py-2 text-zinc-400 hover:text-rose-400 text-xs transition-colors ml-auto"
              >
                Clear Key
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. DATA ARCHIVE & BACKUP */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Download className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Data Archive & Reset</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
            <span className="text-zinc-500 block text-[10px]">Total Mistakes Logged</span>
            <span className="text-lg font-bold text-zinc-100">{mistakes.length}</span>
          </div>
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
            <span className="text-zinc-500 block text-[10px]">Active Recurring Traps</span>
            <span className="text-lg font-bold text-amber-400">{recurringPatterns.length}</span>
          </div>
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
            <span className="text-zinc-500 block text-[10px]">Academic Subjects</span>
            <span className="text-lg font-bold text-indigo-400">{subjects.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export JSON Archive</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset to standard sample Physics curriculum & mistakes?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Sample Data</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all personal mistake records? This cannot be undone.')) {
                clearAllData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
