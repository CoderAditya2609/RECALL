import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Conversation, ChatMessage, PublicUserProfile } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  activeRecipient: PublicUserProfile | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  selectConversation: (conversation: Conversation) => void;
  startDirectConversation: (recipient: PublicUserProfile) => Promise<Conversation>;
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, publicProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<PublicUserProfile | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Helper to generate deterministic conversation ID for 2 users
  const getConversationId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('__');
  };

  // Listen to all conversations the user is a participant in
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setLoadingConversations(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participantIds', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList: Conversation[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Conversation),
        id: docSnap.id,
      }));

      // Sort by lastMessageAt descending
      convList.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });

      setConversations(convList);
      setLoadingConversations(false);
    }, (err) => {
      console.warn('Conversations listener notice:', err);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to messages for the active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, `conversations/${activeConversation.id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as ChatMessage),
        id: docSnap.id,
      }));
      setMessages(msgList);
      setLoadingMessages(false);
    }, (err) => {
      console.warn('Messages listener notice:', err);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeConversation]);

  // Find or create conversation with recipient
  const startDirectConversation = async (recipient: PublicUserProfile): Promise<Conversation> => {
    if (!user || !publicProfile) throw new Error('You must be signed in to chat.');

    const convId = getConversationId(user.uid, recipient.id);
    const existing = conversations.find((c) => c.id === convId);

    if (existing) {
      setActiveConversation(existing);
      setActiveRecipient(recipient);
      return existing;
    }

    const newConv: Conversation = {
      id: convId,
      participantIds: [user.uid, recipient.id],
      participantUsernames: {
        [user.uid]: publicProfile.username,
        [recipient.id]: recipient.username,
      },
      participantDisplayNames: {
        [user.uid]: publicProfile.displayName,
        [recipient.id]: recipient.displayName,
      },
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'conversations', convId), newConv);
      setActiveConversation(newConv);
      setActiveRecipient(recipient);
      return newConv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      // Fallback local selection
      setActiveConversation(newConv);
      setActiveRecipient(recipient);
      return newConv;
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (!user) return;

    const otherId = conversation.participantIds.find((id) => id !== user.uid);
    if (otherId) {
      try {
        const userDocRef = doc(db, 'publicUsers', otherId);
        const snapshot = await getDocs(query(collection(db, 'publicUsers'), where('id', '==', otherId)));
        if (!snapshot.empty) {
          setActiveRecipient(snapshot.docs[0].data() as PublicUserProfile);
        } else {
          setActiveRecipient({
            id: otherId,
            username: conversation.participantUsernames?.[otherId] || 'student',
            displayName: conversation.participantDisplayNames?.[otherId] || conversation.participantUsernames?.[otherId] || 'Student',
            createdAt: '',
            lastActiveAt: '',
          });
        }
      } catch {
        setActiveRecipient({
          id: otherId,
          username: conversation.participantUsernames?.[otherId] || 'student',
          displayName: conversation.participantDisplayNames?.[otherId] || conversation.participantUsernames?.[otherId] || 'Student',
          createdAt: '',
          lastActiveAt: '',
        });
      }
    }
  };

  const sendMessage = async (text: string) => {
    if (!user || !activeConversation || !text.trim() || !publicProfile) return;

    const cleanText = text.trim();
    const now = new Date().toISOString();

    const newMessage: Omit<ChatMessage, 'id'> = {
      conversationId: activeConversation.id,
      senderId: user.uid,
      senderUsername: publicProfile.username,
      message: cleanText,
      createdAt: now,
      read: false,
    };

    try {
      const messagesRef = collection(db, `conversations/${activeConversation.id}/messages`);
      await addDoc(messagesRef, newMessage);

      // Update conversation metadata
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: cleanText,
        lastMessageAt: now,
        lastSenderId: user.uid,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const markAsRead = async (conversationId: string) => {
    // Optional read receipt handling
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        activeRecipient,
        loadingConversations,
        loadingMessages,
        selectConversation,
        startDirectConversation,
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
