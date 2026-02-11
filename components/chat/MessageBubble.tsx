import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

  return (
    <View
      style={[
        styles.container,
        message.isSent ? styles.sentContainer : styles.receivedContainer,
      ]}>
      <View
        style={[
          styles.bubble,
          message.isSent
            ? [styles.sentBubble, isDark ? styles.sentBubbleDark : styles.sentBubbleLight]
            : [styles.receivedBubble, isDark ? styles.receivedBubbleDark : styles.receivedBubbleLight],
        ]}>
        <Text
          style={[
            styles.text,
            message.isSent
              ? styles.sentText
              : [styles.receivedText, isDark ? styles.receivedTextDark : styles.receivedTextLight],
          ]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    marginHorizontal: 16,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sentBubble: {
  },
  sentBubbleLight: {
    backgroundColor: '#0B93F6',
  },
  sentBubbleDark: {
    backgroundColor: '#0B84ED',
  },
  receivedBubble: {
  },
  receivedBubbleLight: {
    backgroundColor: '#E9E9EB',
  },
  receivedBubbleDark: {
    backgroundColor: '#3A3A3C',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#000000',
  },
  receivedTextLight: {
    color: '#000000',
  },
  receivedTextDark: {
    color: '#FFFFFF',
  },
});