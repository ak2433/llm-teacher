import { API_URL } from '@/constants/api';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Format = 'course' | 'guide' | 'roadmap';

const FORMAT_OPTIONS: { id: Format; label: string; icon: string }[] = [
  { id: 'course', label: 'Course', icon: '📖' },
  { id: 'guide', label: 'Guide', icon: '📄' },
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
];

export default function NewSubjectScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<Format>('course');
  const [answerQuestions, setAnswerQuestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const createSubjectAndNavigate = async (name: string) => {
    const res = await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.status === 409) {
      const data = await res.json();
      Alert.alert(
        'Subject Exists',
        `${data.detail}\n\nWould you like to delete the old one and create a new one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              const listRes = await fetch(`${API_URL}/subjects`);
              const subjects = await listRes.json();
              const existing = subjects.find(
                (s: any) => s.name.toLowerCase() === name.toLowerCase(),
              );
              if (existing) {
                await fetch(`${API_URL}/subjects/${existing.id}`, { method: 'DELETE' });
              }
              await createSubjectAndNavigate(name);
            },
          },
        ],
      );
      return;
    }

    if (!res.ok) throw new Error('Failed to create subject');

    const created = await res.json();
    router.replace({
      pathname: '/chat',
      params: {
        subjectId: String(created.id),
        subjectName: created.name,
        isNewSubject: 'true',
      },
    });
  };

  const handleGenerate = async () => {
    const name = topic.trim();
    if (!name) return;

    setIsGenerating(true);
    try {
      await createSubjectAndNavigate(name);
    } catch (e) {
      Alert.alert('Error', 'Failed to create subject. Is the backend running?');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>What can I help you learn?</Text>
        <Text style={styles.subtitle}>
          Enter a topic below to generate a personalized course for it.
        </Text>

        {/* Topic input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>What can I help you learn?</Text>
          <View style={styles.messageBox}>
            <TextInput
              id="topicInput"
              style={styles.input}
              placeholder="Enter a topic"
              placeholderTextColor="rgb(136, 136, 136)"
              value={topic}
              onChangeText={setTopic}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Format selection */}
        <View style={styles.formatSection}>
          <Text style={styles.label}>Choose the format</Text>
          <View style={styles.formatRow}>
            {FORMAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.formatCard,
                  format === opt.id && styles.formatCardSelected,
                ]}
                onPress={() => setFormat(opt.id)}
              >
                <Text
                  style={[
                    styles.formatIcon,
                    format !== opt.id && styles.formatIconUnselected,
                  ]}
                >
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    styles.formatLabel,
                    format !== opt.id && styles.formatLabelUnselected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxSection}
          onPress={() => setAnswerQuestions(!answerQuestions)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, answerQuestions && styles.checkboxChecked]}>
            {answerQuestions && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Answer the following questions for a better course
          </Text>
        </TouchableOpacity>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || !topic.trim()}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.generateIcon}>✦</Text>
              <Text style={styles.generateText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* UI rules: #212121 background, #ffffff text, primary #006BB3, card, messageBox */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgb(170, 170, 170)',
    fontSize: 15,
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    color: 'rgb(170, 170, 170)',
    fontSize: 14,
    marginBottom: 10,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 0,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  formatSection: {
    marginBottom: 24,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgb(63, 63, 63)',
    minHeight: 100,
  },
  formatCardSelected: {
    borderColor: '#006BB3',
    backgroundColor: 'rgba(0, 107, 179, 0.15)',
  },
  formatIcon: {
    fontSize: 28,
    marginBottom: 8,
    color: '#ffffff',
  },
  formatIconUnselected: {
    color: 'rgb(136, 136, 136)',
  },
  formatLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formatLabelUnselected: {
    color: 'rgb(136, 136, 136)',
  },
  checkboxSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgb(110, 110, 110)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#006BB3',
    borderColor: '#006BB3',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006BB3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  generateText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
