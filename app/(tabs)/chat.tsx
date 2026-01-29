import { ChatInput } from '@/components/chat/ChatInput';
import { LandingPage } from '@/components/chat/LandingPage';
import { MessageBubble, type Message } from '@/components/chat/MessageBubble';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const showLandingPage = messages.length === 0;

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isSent: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate a response after a short delay
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(text),
        timestamp: new Date(),
        isSent: false,
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handleActionPress = (actionId: string) => {
    const actionPrompts: Record<string, string> = {
      code: 'Help me with coding',
      profile: 'Teach me something new',
      strategize: 'Help me plan and strategize',
      write: 'Help me write',
      life: 'Help me with life stuff',
    };
    const prompt = actionPrompts[actionId] || 'Help me';
    handleSend(prompt);
  };

  const generateResponse = (input: string): string => {
    const responses = [
      "That's interesting! Tell me more.",
      'I see what you mean.',
      'Thanks for sharing that with me.',
      'That makes sense.',
      'I appreciate your perspective.',
      'That sounds great!',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
