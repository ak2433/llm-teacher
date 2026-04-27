import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { CodeBlock } from '@/components/chat/CodeBlock';

export type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
};

type MessageBubbleProps = {
  message: Message;
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

/* UI rules: #ffffff text */
const markdownStyles = {
  body: { fontSize: 15, lineHeight: 21, color: '#ffffff' },
  heading1: { color: '#ffffff', fontSize: 20, fontWeight: '700' as const, marginTop: 16, marginBottom: 8 },
  heading2: { color: '#ffffff', fontSize: 18, fontWeight: '600' as const, marginTop: 14, marginBottom: 6 },
  heading3: { color: '#f0f0f0', fontSize: 16, fontWeight: '600' as const, marginTop: 12, marginBottom: 4 },
  strong: { color: '#ffffff', fontWeight: '600' as const },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
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
  paragraph: { marginVertical: 4 },
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.isSent) {
    return (
      <View style={[styles.container, styles.sentContainer]}>
        <View style={styles.sentBubble}>
          <Markdown
            style={{ body: markdownStyles.body }}
            rules={markdownCodeRules}>
            {message.text}
          </Markdown>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.receivedContainer]}>
      <Markdown style={markdownStyles} rules={markdownCodeRules}>
        {message.text}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  sentBubble: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: '75%',
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
});
