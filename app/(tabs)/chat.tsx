import { ChatInput } from '@/components/chat/ChatInput';
import { LandingPage } from '@/components/chat/LandingPage';
import { MessageBubble, type Message } from '@/components/chat/MessageBubble';
import { ThinkingLoader } from '@/components/chat/ThinkingLoader';
import { AppNavMenu } from '@/components/navigation/AppNavMenu';
import { API_URL, EXPO_OLLAMA_MODEL } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
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

const MAX_CHAT_WIDTH = 720;

export default function ChatScreen() {
  const { subjectId, subjectName, isNewSubject } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
    isNewSubject?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizPayload, setQuizPayload] = useState<{
    quiz: {
      section_id: string;
      title: string;
      questions: { question: string; choices: string[] }[];
    };
    total_sections: number;
    section_index: number;
    progress_percent: number;
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const showLandingPage = messages.length === 0;

  const openQuizModal = async () => {
    if (!subjectId) {
      Alert.alert('Quiz', 'Open a subject chat first.');
      return;
    }
    setQuizModalVisible(true);
    setQuizLoading(true);
    setQuizPayload(null);
    setQuizAnswers([]);
    try {
      const res = await fetch(`${API_URL}/subjects/${subjectId}/quiz/current`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : res.statusText);
      }
      if (data.completed) {
        Alert.alert('Course complete', data.message ?? 'You have finished all syllabus quizzes.');
        setQuizModalVisible(false);
        return;
      }
      const q = data.quiz;
      if (!q?.questions?.length) {
        throw new Error('No quiz questions returned.');
      }
      setQuizPayload({
        quiz: q,
        total_sections: data.total_sections ?? 1,
        section_index: data.section_index ?? 0,
        progress_percent: data.progress_percent ?? 0,
      });
      setQuizAnswers(Array(q.questions.length).fill(-1));
    } catch (e) {
      Alert.alert('Quiz', formatChatError(e));
      setQuizModalVisible(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const selectQuizAnswer = (questionIndex: number, choiceIndex: number) => {
    setQuizAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = choiceIndex;
      return next;
    });
  };

  const submitQuiz = async () => {
    if (!subjectId || !quizPayload) return;
    if (quizAnswers.some((a) => a < 0)) {
      Alert.alert('Quiz', 'Answer every question before submitting.');
      return;
    }
    setQuizSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/subjects/${subjectId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: quizPayload.quiz.section_id,
          answers: quizAnswers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : res.statusText);
      }
      const passed = Boolean(data.passed);
      const score = typeof data.score_percent === 'number' ? data.score_percent : 0;
      Alert.alert(
        passed ? 'Passed' : 'Try again',
        passed
          ? `Score ${score}%. Progress ${data.progress_percent}%.${
              data.course_completed ? ' Course complete!' : ''
            }`
          : `Score ${score}%. Need above 75% to advance.`,
      );
      setQuizModalVisible(false);
      setQuizPayload(null);
    } catch (e) {
      Alert.alert('Quiz', formatChatError(e));
    } finally {
      setQuizSubmitting(false);
    }
  };

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
        is_new_subject: false,
      };
      if (EXPO_OLLAMA_MODEL) {
        chatPayload.model = EXPO_OLLAMA_MODEL;
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload),
      });

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
      <AppNavMenu
        subjectId={subjectId}
        subjectName={typeof subjectName === 'string' ? subjectName : undefined}
      />

      <View style={styles.shell}>
        <View style={styles.mainColumn}>
      {isLoadingHistory && subjectId && isNewSubject !== 'true' ? (
        <View style={styles.landingContainer}>
          <View style={styles.loadingContainer}>
            <ThinkingLoader />
          </View>
          <View style={styles.centered}>
            <ChatInput onSend={handleSend} onQuizPress={openQuizModal} />
          </View>
        </View>
      ) : showLandingPage ? (
        <View style={styles.landingContainer}>
          <LandingPage
            courseTitle={typeof subjectName === 'string' ? subjectName : undefined}
          />
          <View style={styles.centered}>
            <ChatInput onSend={handleSend} onQuizPress={openQuizModal} />
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
            <ChatInput onSend={handleSend} onQuizPress={openQuizModal} />
          </View>
        </>
      )}
        </View>
      </View>

      <Modal
        visible={quizModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !quizSubmitting && setQuizModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Section quiz</Text>
            {quizLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color="#006BB3" size="large" />
                <Text style={styles.modalHint}>Generating quiz…</Text>
              </View>
            ) : quizPayload ? (
              <>
                <Text style={styles.modalSectionTitle} numberOfLines={2}>
                  {quizPayload.quiz.title}
                </Text>
                <Text style={styles.modalMeta}>
                  Section {quizPayload.section_index + 1} of {quizPayload.total_sections}
                  {' · Progress '}
                  {quizPayload.progress_percent}%
                </Text>
                <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  {quizPayload.quiz.questions.map((q, qi) => (
                    <View key={`q-${qi}`} style={styles.questionBlock}>
                      <Text style={styles.questionText}>{q.question}</Text>
                      {q.choices.map((choice, ci) => {
                        const selected = quizAnswers[qi] === ci;
                        return (
                          <TouchableOpacity
                            key={`c-${qi}-${ci}`}
                            style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                            onPress={() => selectQuizAnswer(qi, ci)}
                          >
                            <Text style={styles.choiceLetter}>{String.fromCharCode(65 + ci)}.</Text>
                            <Text style={styles.choiceText}>{choice}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalBtnSecondary}
                    onPress={() => !quizSubmitting && setQuizModalVisible(false)}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, quizSubmitting && styles.modalBtnDisabled]}
                    onPress={submitQuiz}
                    disabled={quizSubmitting}
                  >
                    {quizSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.modalBtnPrimaryText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.modalHint}>No quiz loaded.</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* UI rules: #212121 background, #ffffff text, primary button #006BB3 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    position: 'relative',
  },
  shell: {
    flex: 1,
    minHeight: 0,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    width: '100%',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    maxHeight: '88%',
    padding: 16,
    width: '100%',
    maxWidth: MAX_CHAT_WIDTH,
    alignSelf: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalMeta: {
    color: '#cccccc',
    fontSize: 13,
    marginBottom: 12,
  },
  modalScroll: {
    maxHeight: 420,
    marginBottom: 12,
  },
  modalLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalHint: {
    color: '#cccccc',
    fontSize: 14,
  },
  questionBlock: {
    marginBottom: 18,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '600',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#212121',
    borderWidth: 1,
    borderColor: '#3f3f3f',
  },
  choiceRowSelected: {
    borderColor: '#006BB3',
    backgroundColor: '#1a3d52',
  },
  choiceLetter: {
    color: '#ffffff',
    fontWeight: '700',
    width: 28,
    marginRight: 8,
  },
  choiceText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  modalBtnSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnSecondaryText: {
    color: '#cccccc',
    fontSize: 16,
  },
  modalBtnPrimary: {
    backgroundColor: '#006BB3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
});
