import { CodeBlock } from '@/components/chat/CodeBlock';
import { API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

function trimFenceContent(content: string): string {
  if (
    typeof content === 'string' &&
    content.length > 0 &&
    content.charAt(content.length - 1) === '\n'
  ) {
    return content.substring(0, content.length - 1);
  }
  return content;
}

const markdownCodeRules = {
  fence: (node: { key: string; content: string; sourceInfo?: string }) => {
    const content = trimFenceContent(node.content);
    return (
      <CodeBlock
        key={node.key}
        code={content}
        language={node.sourceInfo ?? ''}
      />
    );
  },
  code_block: (node: { key: string; content: string }) => {
    const content = trimFenceContent(node.content);
    return <CodeBlock key={node.key} code={content} language="" />;
  },
};

const markdownStyles = {
  body: { fontSize: 15, lineHeight: 22, color: '#ffffff' },
  heading1: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 18,
    marginBottom: 10,
  },
  heading2: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading3: {
    color: '#f0f0f0',
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 14,
    marginBottom: 6,
  },
  strong: { color: '#ffffff', fontWeight: '600' as const },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { marginVertical: 3 },
  code_inline: {
    backgroundColor: '#1a1a1a',
    color: '#e6edf3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3c3c3c',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  paragraph: { marginVertical: 6 },
  hr: { backgroundColor: '#3f3f3f', marginVertical: 14 },
};

export default function SyllabusOutlineScreen() {
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState('');
  const [courseTitle, setCourseTitle] = useState(subjectName ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) {
      setError('Missing subject.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/subjects/${subjectId}/syllabus/outline`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setCourseTitle(typeof data.course_title === 'string' ? data.course_title : subjectName ?? '');
          setMarkdown(typeof data.markdown === 'string' ? data.markdown : '');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, subjectName]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          Course outline
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#006BB3" size="large" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.courseHeading}>{courseTitle || 'Course'}</Text>
            <View style={styles.mdWrap}>
              <Markdown style={markdownStyles} rules={markdownCodeRules}>
                {markdown || '*No content.*'}
              </Markdown>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(63, 63, 63)',
  },
  backBtn: {
    padding: 10,
    marginRight: 4,
  },
  topTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  courseHeading: {
    color: '#aaaaaa',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mdWrap: {
    flexGrow: 1,
  },
  errorText: {
    color: '#ff8888',
    fontSize: 15,
    lineHeight: 22,
  },
});
