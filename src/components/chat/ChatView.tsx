import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { PublicUserProfile } from '../../types';
import {
  Search,
  Send,
  MessageSquare,
  UserPlus,
  Circle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowLeft,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    conversations,
    activeConversation,
    messages,
    activeRecipient,
    loadingConversations,
    loadingMessages,
    selectConversation,
    startDirectConversation,
    sendMessage,
  } = useChat();

  const { user, publicProfile, searchUsersByUsername, isGuest } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(!activeConversation);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsersByUsername(q);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChatWithUser = async (targetUser: PublicUserProfile) => {
    try {
      await startDirectConversation(targetUser);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setShowMobileList(false);
    } catch (err) {
      console.warn('Failed to start chat:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    const text = messageInput;
    setMessageInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* LEFT SIDEBAR: Conversations List & Search */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-md ${
          activeConversation && !showMobileList ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-100">Study Chat</h2>
          </div>
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Current User Quick Badge */}
        {publicProfile && (
          <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-400">Logged in as:</span>
              <span className="font-semibold text-zinc-200">@{publicProfile.username}</span>
            </div>
            {isGuest && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                Guest
              </span>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {loadingConversations ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading study threads...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-300">No active conversations</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Find peers by username to discuss tricky Physics questions and study together.
              </p>
              <button
                onClick={() => setShowSearchModal(true)}
                className="mt-4 px-4 py-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 transition-colors"
              >
                Search Users
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUserId = conv.participantIds.find((id) => id !== user?.uid) || '';
              const otherUsername = conv.participantUsernames?.[otherUserId] || 'student';
              const otherDisplayName = conv.participantDisplayNames?.[otherUserId] || otherUsername;
              const isSelected = activeConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv);
                    setShowMobileList(false);
                  }}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-indigo-300 uppercase">
                      {otherUsername.slice(0, 2)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-zinc-200 truncate">{otherDisplayName}</h4>
                      <span className="text-[11px] text-zinc-500">{formatConversationDate(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {conv.lastSenderId === user?.uid && <span className="text-zinc-500">You: </span>}
                      {conv.lastMessage || 'Started conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div
        className={`flex-1 flex flex-col bg-zinc-950 ${
          !activeConversation && !showMobileList ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation && activeRecipient ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 uppercase">
                    {activeRecipient.username.slice(0, 2)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    {activeRecipient.displayName || activeRecipient.username}
                    <span className="text-xs font-normal text-zinc-400">@{activeRecipient.username}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active peer</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Private encrypted channel</span>
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-center my-4">
                <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] text-zinc-500">
                  Direct study conversation with @{activeRecipient.username}
                </div>
              </div>

              {loadingMessages ? (
                <div className="text-center text-xs text-zinc-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  <p>No messages yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">Say hello or share a tricky physics problem to discuss!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[10px] text-zinc-500 mb-1 ml-1 font-medium">
                            @{msg.senderUsername}
                          </span>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-bl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 px-1">
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message @${activeRecipient.username}... (Press Enter to send)`}
                  rows={2}
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">Study Collaboration Hub</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Select an existing study thread or search for fellow students by @username to start collaborating on mistake diagnostics.
            </p>
            <button
              onClick={() => setShowSearchModal(true)}
              className="mt-5 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Search Students by Username</span>
            </button>
          </div>
        )}
      </div>

      {/* USER SEARCH MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100">Find Students by Username</h3>
              </div>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Type username (e.g. @alex, physics_pro)..."
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isSearching ? (
                <div className="text-center py-6 text-xs text-zinc-500">Searching active students...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((target) => (
                  <div
                    key={target.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
                        {target.username.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{target.displayName || target.username}</h4>
                        <p className="text-[11px] text-indigo-400">@{target.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartChatWithUser(target)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Message
                    </button>
                  </div>
                ))
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No students found matching "{searchQuery}".
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Enter a username or handle to search the RECALL student network.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
