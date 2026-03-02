import { ChatInput } from '@/components/chat/ChatInput';
import { LandingPage } from '@/components/chat/LandingPage';
import { MessageBubble, type Message } from '@/components/chat/MessageBubble';
import { ThinkingLoader } from '@/components/chat/ThinkingLoader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';

import {
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Configure your FastAPI backend URL
// For local development:
// - iOS Simulator: http://localhost:8000
// - Android Emulator: http://10.0.2.2:8000
// - Physical device: http://YOUR_COMPUTER_IP:8000
const API_URL = Platform.select({
  ios: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  default: 'http://10.0.0.23:8000',
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const showLandingPage = messages.length === 0;
  const router = useRouter();

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

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          model: 'llama3.1:8b',
          subject: subjectName ?? null,
          subject_id: subjectId ? parseInt(subjectId) : null,
          is_new_subject: isFirstMessage,
        }),
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
          text: `Sorry, I couldn't connect to the AI. Please make sure the backend is running. Error: ${error}`,
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

  const handleActionPress = (actionId: string) => {
    if (actionId === 'profile') {
      router.push('/profile');
      return;
    }

    const actionPrompts: Record<string, string> = {
      code: 'Help me with coding',
      strategize: 'Help me plan and strategize',
      write: 'Help me write',
      life: 'Help me with life stuff',
    };
    const prompt = actionPrompts[actionId] || 'Help me';
    handleSend(prompt);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1A1A1A' }]} edges={['top']}>
      <StatusBar style="light" />
      {showLandingPage ? (
        <View style={styles.landingContainer}>
          <LandingPage onActionPress={handleActionPress} />
          <ChatInput onSend={handleSend} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isLoading ? <ThinkingLoader /> : null
            }
          />
          <ChatInput onSend={handleSend} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  landingContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
});
