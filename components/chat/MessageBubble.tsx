import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

export type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
};

type MessageBubbleProps = {
  message: Message;
};

/* UI rules: #ffffff text, #2d2d2d code blocks */
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
    backgroundColor: '#2d2d2d',
    color: '#e0e0e0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fence: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 14,
    color: '#e0e0e0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  paragraph: { marginVertical: 4 },
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.isSent) {
    return (
      <View style={[styles.container, styles.sentContainer]}>
        <View style={styles.sentBubble}>
          <Markdown style={{ body: markdownStyles.body }}>{message.text}</Markdown>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.receivedContainer]}>
      <Markdown style={markdownStyles}>{message.text}</Markdown>
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
