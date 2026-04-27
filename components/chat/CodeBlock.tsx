import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Prism from '@/components/chat/prismSetup';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Token, TokenStream } from 'prismjs';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const TOKEN_COLORS: Record<string, string> = {
  plain: '#e6edf3',
  comment: '#8b949e',
  prolog: '#8b949e',
  doctype: '#8b949e',
  cdata: '#8b949e',
  punctuation: '#c9d1d9',
  namespace: '#ff7b72',
  property: '#79c0ff',
  tag: '#7ee787',
  boolean: '#79c0ff',
  number: '#79c0ff',
  constant: '#79c0ff',
  symbol: '#79c0ff',
  deleted: '#ffa198',
  selector: '#7ee787',
  'attr-name': '#79c0ff',
  string: '#a5e878',
  char: '#a5e878',
  builtin: '#ffa657',
  inserted: '#7ee787',
  operator: '#ff7b72',
  entity: '#7ee787',
  url: '#a5d6ff',
  atrule: '#f472b6',
  'attr-value': '#a5e878',
  keyword: '#f472b6',
  function: '#d2a8ff',
  'class-name': '#ffa657',
  regex: '#a5d6ff',
  important: '#f472b6',
  variable: '#79c0ff',
};

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  cs: 'csharp',
  csharp: 'csharp',
  kt: 'kotlin',
  swift: 'swift',
  golang: 'go',
  h: 'c',
  hpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  'c++': 'cpp',
};

const DISPLAY_LANG: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  python: 'Python',
  rust: 'Rust',
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  go: 'Go',
  bash: 'Bash',
  yaml: 'YAML',
  json: 'JSON',
  css: 'CSS',
  sql: 'SQL',
  csharp: 'C#',
  kotlin: 'Kotlin',
  swift: 'Swift',
  ruby: 'Ruby',
  markdown: 'Markdown',
  markup: 'HTML',
  diff: 'Diff',
};

function normalizeLanguage(info: string): string | null {
  const raw = info
    .trim()
    .split(/\s/)[0]
    ?.replace(/^language-/, '')
    .toLowerCase();
  if (!raw) return null;
  return LANG_ALIASES[raw] ?? raw;
}

function displayLanguage(info: string, normalized: string | null): string {
  if (normalized && DISPLAY_LANG[normalized]) return DISPLAY_LANG[normalized];
  const raw = info.trim().split(/\s/)[0]?.replace(/^language-/, '') ?? '';
  if (!raw) return 'Code';
  return raw.length <= 12 ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
}

function streamToParts(stream: TokenStream): (string | Token)[] {
  if (typeof stream === 'string') return [stream];
  if (Array.isArray(stream)) return stream;
  return [stream as Token];
}

function colorForToken(t: Token): string {
  const aliases = t.alias
    ? Array.isArray(t.alias)
      ? t.alias
      : [t.alias]
    : [];
  for (const a of aliases) {
    if (TOKEN_COLORS[a]) return TOKEN_COLORS[a];
  }
  return TOKEN_COLORS[t.type] ?? TOKEN_COLORS.plain;
}

function HighlightedTokens({
  tokens,
  keyPrefix,
}: {
  tokens: (string | Token)[];
  keyPrefix: string;
}): React.ReactNode {
  return tokens.map((item, i) => {
    const key = `${keyPrefix}:${i}`;
    if (typeof item === 'string') {
      return item;
    }
    const color = colorForToken(item);
    const parts = streamToParts(item.content);
    const onlyString = parts.length === 1 && typeof parts[0] === 'string';
    if (onlyString) {
      return (
        <Text key={key} style={{ color }}>
          {parts[0] as string}
        </Text>
      );
    }
    return (
      <Text key={key} style={{ color }}>
        <HighlightedTokens tokens={parts as (string | Token)[]} keyPrefix={key} />
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    marginVertical: 10,
    overflow: 'hidden',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2c',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  langLabel: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  copyBtnPressed: {
    opacity: 0.75,
  },
  copyLabel: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: '600',
  },
  codeText: {
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: TOKEN_COLORS.plain,
    ...(Platform.OS === 'web'
      ? ({ whiteSpace: 'pre' } as import('react-native').TextStyle)
      : {}),
  },
});

function useHighlightedCode(code: string, languageInfo: string) {
  return useMemo(() => {
    const lang = normalizeLanguage(languageInfo);
    const grammar =
      lang && Prism.languages[lang] ? Prism.languages[lang] : null;
    if (!grammar) {
      return (
        <Text style={styles.codeText} selectable>
          {code}
        </Text>
      );
    }
    try {
      const tokenized = Prism.tokenize(code, grammar) as (string | Token)[];
      return (
        <Text style={styles.codeText} selectable>
          <HighlightedTokens tokens={tokenized} keyPrefix="root" />
        </Text>
      );
    } catch {
      return (
        <Text style={styles.codeText} selectable>
          {code}
        </Text>
      );
    }
  }, [code, languageInfo]);
}

type CodeBlockProps = {
  code: string;
  language: string;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const normalized = normalizeLanguage(language);
  const label = displayLanguage(language, normalized);
  const body = useHighlightedCode(code, language);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <View style={styles.outer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol
            name="chevron.left.forwardslash.chevron.right"
            size={18}
            color="#c9d1d9"
          />
          <Text style={styles.langLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Pressable
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyBtn,
            pressed && styles.copyBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Copy code">
          <MaterialIcons name="content-copy" size={18} color="#c9d1d9" />
          <Text style={styles.copyLabel}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}>
        {body}
      </ScrollView>
    </View>
  );
}
