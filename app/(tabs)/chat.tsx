import { ChatInput } from '@/components/chat/ChatInput';
import { LandingPage } from '@/components/chat/LandingPage';
import { MessageBubble, type Message } from '@/components/chat/MessageBubble';
import { ThinkingLoader } from '@/components/chat/ThinkingLoader';
import { API_URL, EXPO_OLLAMA_MODEL } from '@/constants/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';

import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatChatError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/llama runner|runner process has terminated|status code:\s*500/i.test(raw)) {
    return (
      'The AI model (Ollama) stopped mid-run—often not enough RAM/VRAM for the model. ' +
      'Try: (1) `ollama pull llama3.2:3b` then set environment variable OLLAMA_MODEL=llama3.2:3b before starting the backend, ' +
      'or (2) set EXPO_PUBLIC_OLLAMA_MODEL=llama3.2:3b for the app if you only override from the client. ' +
      'Restart Ollama and the backend. Technical detail: ' +
      raw
    );
  }
  if (/NetworkError|Failed to fetch|fetch/i.test(raw)) {
    return (
      'Could not reach the API. Check that the backend is running and API_URL matches (see constants/api.ts). ' +
      raw
    );
  }
  return `Something went wrong: ${raw}`;
}

export default function ChatScreen() {
  const { subjectId, subjectName, isNewSubject } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
    isNewSubject?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(isNewSubject === 'true');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const showLandingPage = messages.length === 0;
  const router = useRouter();

  // Fetch last 2 message interactions when opening an existing subject
  useEffect(() => {
    if (!subjectId || isNewSubject === 'true') {
      setIsLoadingHistory(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/subjects/${subjectId}/messages?limit=4`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const msgs = data.messages || [];
        if (msgs.length === 0) {
          setIsLoadingHistory(false);
          return;
        }
        const history: ChatMessage[] = msgs.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const uiMessages: Message[] = msgs.map((m: { id: number; role: string; content: string }, i: number) => ({
          id: `hist-${m.id}-${i}`,
          text: m.content,
          timestamp: new Date(),
          isSent: m.role === 'user',
        }));
        if (!cancelled) {
          setChatHistory(history);
          setMessages(uiMessages);
        }
      } catch {
        // Ignore fetch errors (e.g. backend offline)
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId, isNewSubject]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendToOllama = async (userMessage: string) => {
    try {
      setIsLoading(true);

      const updatedHistory: ChatMessage[] = [
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      const chatPayload: Record<string, unknown> = {
        messages: updatedHistory,
        subject: subjectName ?? null,
        subject_id: subjectId ? parseInt(subjectId) : null,
        is_new_subject: isFirstMessage,
      };
      if (EXPO_OLLAMA_MODEL) {
        chatPayload.model = EXPO_OLLAMA_MODEL;
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload),
      });

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assistantMessageId = Date.now().toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        timestamp: new Date(),
        isSent: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              fullText += parsed.token;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, text: fullText } : msg,
                ),
              );
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: fullText },
      ]);
    } catch (error) {
      console.error('Error communicating with Ollama:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: formatChatError(error),
          timestamp: new Date(),
          isSent: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isSent: true,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Send to Ollama
    await sendToOllama(text);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>JD</Text>
          </View>
        </TouchableOpacity>
        {subjectName ? (
          <Text style={styles.headerTitle} numberOfLines={1}>{subjectName}</Text>
        ) : null}
      </View>

      {isLoadingHistory && subjectId && isNewSubject !== 'true' ? (
        <View style={styles.landingContainer}>
          <View style={styles.loadingContainer}>
            <ThinkingLoader />
          </View>
          <View style={styles.centered}>
            <ChatInput onSend={handleSend} onQuizPress={() => handleSend('Quiz me')} />
          </View>
        </View>
      ) : showLandingPage ? (
        <View style={styles.landingContainer}>
          <LandingPage />
          <View style={styles.centered}>
            <ChatInput onSend={handleSend} onQuizPress={() => handleSend('Quiz me')} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.chatWrapper}>
            <View style={[styles.centered, styles.chatListHost]}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <MessageBubble message={item} />}
                contentContainerStyle={styles.listContent}
                style={[styles.list, Platform.OS === 'web' && styles.listWebNoScrollbar]}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                  isLoading ? <ThinkingLoader /> : null
                }
              />
            </View>
          </View>
          <View style={styles.centered}>
            <ChatInput onSend={handleSend} onQuizPress={() => handleSend('Quiz me')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const MAX_CHAT_WIDTH = 720;

/* UI rules: #212121 background, #ffffff text, primary button #006BB3 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(63, 63, 63)',
  },
  profileBtn: {
    marginRight: 12,
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#006BB3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  landingContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatWrapper: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
  },
  chatListHost: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    width: '100%',
    maxWidth: MAX_CHAT_WIDTH,
    alignSelf: 'center',
  },
  list: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  /* Hide scrollbars on web while keeping scroll behavior */
  listWebNoScrollbar: {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  } as import('react-native').ViewStyle,
  listContent: {
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
});
