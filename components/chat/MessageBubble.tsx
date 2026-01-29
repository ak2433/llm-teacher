import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
        <Text
          style={[
            styles.timestamp,
            message.isSent
              ? styles.sentTimestamp
              : [styles.receivedTimestamp, isDark ? styles.receivedTimestampDark : styles.receivedTimestampLight],
          ]}>
          {formatTime(message.timestamp)}
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
    marginVertical: 2,
    marginHorizontal: 12,
    maxWidth: '75%',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  sentBubbleLight: {
    backgroundColor: '#2C6BED',
  },
  sentBubbleDark: {
    backgroundColor: '#2160C4',
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
  },
  receivedBubbleLight: {
    backgroundColor: '#E5E5EA',
  },
  receivedBubbleDark: {
    backgroundColor: '#2C2C2E',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
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
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  sentTimestamp: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: '#666666',
  },
  receivedTimestampLight: {
    color: '#666666',
  },
  receivedTimestampDark: {
    color: '#999999',
  },
});
