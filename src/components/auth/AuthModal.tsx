import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogIn,
  UserPlus,
  Lock,
  User,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { signIn, signUp, authError, clearAuthError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearAuthError();

    let success = false;
    if (mode === 'signin') {
      success = await signIn(username, password);
    } else {
      success = await signUp(username, displayName, password);
    }

    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleQuickFill = (u: string, d: string, p: string) => {
    setUsername(u);
    setDisplayName(d);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-b from-indigo-950/40 to-transparent relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              R
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">RECALL Intelligence</span>
          </div>
          <h2 className="text-xl font-black text-zinc-100">
            {mode === 'signin' ? 'Sign In to Your Account' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'signin'
              ? 'Enter your username and password to access your mistake journal & study chats.'
              : 'Choose a unique username handle, display name, and password.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              clearAuthError();
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearAuthError();
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 space-y-4 text-xs">
          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                Username Handle *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. aditya or quantum_master"
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Letters, numbers, and underscores (used for peer discovery and chat)
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Display Name (Full Name / Nickname)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Aditya Verma"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                {mode === 'signin' ? 'Account Password *' : 'Set Account Password *'}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-4 text-xs"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT & SIGN IN</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Student Account Fill */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Quick Test:</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  handleQuickFill('aditya_jee', 'Aditya Verma', 'pass123');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-mono underline"
              >
                @aditya_jee
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  handleQuickFill('quantum_alex', 'Alex M.', 'pass123');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-mono underline"
              >
                @quantum_alex
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
