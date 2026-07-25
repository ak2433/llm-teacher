import { CodeBlock } from '@/components/chat/CodeBlock';
import { AppNavMenu } from '@/components/navigation/AppNavMenu';
import { API_URL } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

type SyllabusModule = {
  module: number;
  title: string;
  objectives?: string[];
  topics?: string[];
  estimated_length?: string;
  prerequisites?: string[];
  takeaways?: string[];
};

type Syllabus = {
  course_title?: string;
  modules?: SyllabusModule[];
};

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

function ModuleOutline({ mod }: { mod: SyllabusModule }) {
  return (
    <View style={styles.moduleBlock}>
      <Text style={styles.moduleTitle}>
        Module {mod.module}: {mod.title}
      </Text>

      <Text style={styles.sectionLabel}>Learning Objectives</Text>
      {(mod.objectives ?? []).length === 0 ? (
        <Text style={styles.muted}>None</Text>
      ) : (
        (mod.objectives ?? []).map((obj, i) => (
          <Text key={`obj-${i}`} style={styles.bullet}>
            • {obj}
          </Text>
        ))
      )}

      <Text style={styles.sectionLabel}>Topics</Text>
      {(mod.topics ?? []).length === 0 ? (
        <Text style={styles.muted}>None</Text>
      ) : (
        (mod.topics ?? []).map((topic, i) => (
          <Text key={`topic-${i}`} style={styles.numbered}>
            {i + 1}. {topic}
          </Text>
        ))
      )}

      <Text style={styles.sectionLabel}>Estimated Length</Text>
      <Text style={styles.bodyLine}>{mod.estimated_length || '—'}</Text>

      <Text style={styles.sectionLabel}>Prerequisites</Text>
      <Text style={styles.bodyLine}>
        {(mod.prerequisites ?? []).length > 0
          ? (mod.prerequisites ?? []).join(', ')
          : 'None'}
      </Text>

      {(mod.takeaways ?? []).length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Takeaways</Text>
          {(mod.takeaways ?? []).map((t, i) => (
            <Text key={`take-${i}`} style={styles.bullet}>
              • {t}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

export default function SyllabusOutlineScreen() {
  const { subjectId, subjectName } = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
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
          const s = (data.syllabus ?? null) as Syllabus | null;
          setSyllabus(s);
          setMarkdown(typeof data.markdown === 'string' ? data.markdown : '');
          setCourseTitle(
            typeof data.course_title === 'string'
              ? data.course_title
              : s?.course_title || subjectName || ''
          );
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

  const modules = syllabus?.modules ?? [];
  const hasModules = modules.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <AppNavMenu
        subjectId={subjectId}
        subjectName={typeof subjectName === 'string' ? subjectName : undefined}
      />

      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
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
            {hasModules ? (
              modules.map((mod) => (
                <ModuleOutline key={`${mod.module}-${mod.title}`} mod={mod} />
              ))
            ) : markdown.trim() ? (
              <View style={styles.mdWrap}>
                <Markdown style={markdownStyles} rules={markdownCodeRules}>
                  {markdown}
                </Markdown>
              </View>
            ) : (
              <Text style={styles.emptyText}>No syllabus outline available.</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 10,
  },
  topBarSpacer: {
    width: 44,
  },
  topTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
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
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  moduleBlock: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  moduleTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#f0f0f0',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  bullet: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 4,
    marginVertical: 2,
  },
  numbered: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 4,
    marginVertical: 2,
  },
  bodyLine: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  muted: {
    color: '#888888',
    fontSize: 15,
    lineHeight: 22,
  },
  mdWrap: {
    flexGrow: 1,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 15,
  },
  errorText: {
    color: '#ff8888',
    fontSize: 15,
    lineHeight: 22,
  },
});
