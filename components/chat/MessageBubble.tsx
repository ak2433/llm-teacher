import { useColorScheme } from '@/hooks/use-color-scheme';
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

export function MessageBubble({ message }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (message.isSent) {
    return (
      <View style={[styles.container, styles.sentContainer]}>
        <View style={[styles.sentBubble, isDark ? styles.sentBubbleDark : styles.sentBubbleLight]}>
          <Markdown
            style={{
              body: {
                fontSize: 15,
                lineHeight: 21,
                color: '#FFFFFF',
              },
            }}
          >
            {message.text}
          </Markdown>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.receivedContainer]}>
      <Markdown
        style={{
          body: {
            fontSize: 15,
            lineHeight: 24,
            color: isDark ? '#E0E0E0' : '#D0D0D0',
          },
          heading1: { color: isDark ? '#FFFFFF' : '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
          heading2: { color: isDark ? '#FFFFFF' : '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 14, marginBottom: 6 },
          heading3: { color: isDark ? '#F0F0F0' : '#F0F0F0', fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
          strong: { color: isDark ? '#FFFFFF' : '#FFFFFF', fontWeight: '600' },
          bullet_list: { marginVertical: 4 },
          ordered_list: { marginVertical: 4 },
          list_item: { marginVertical: 2 },
          code_inline: {
            backgroundColor: '#2A2A2A',
            color: '#E0E0E0',
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 14,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          },
          fence: {
            backgroundColor: '#2A2A2A',
            padding: 12,
            borderRadius: 8,
            marginVertical: 8,
            fontSize: 14,
            color: '#E0E0E0',
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          },
          paragraph: { marginVertical: 4 },
        }}
      >
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
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '75%',
  },
  sentBubbleLight: {
    backgroundColor: '#303030',
  },
  sentBubbleDark: {
    backgroundColor: '#303030',
  },
});
