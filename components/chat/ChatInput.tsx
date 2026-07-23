import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useCallback } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
const BUBBLE_POSITIONS: { x: number; y: number }[] = [
  { x: 0, y: -1 },
  { x: 0.6, y: -0.8 },
  { x: -0.6, y: -0.8 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0.6, y: 0.8 },
  { x: -0.6, y: 0.8 },
  { x: 0, y: 1 },
];

function QuizButton({ onPress }: { onPress?: () => void }) {
  const progress = useSharedValue(0);

  const triggerBubbles = useCallback(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600 });
  }, [progress]);

  const handlePressIn = useCallback(() => {
    triggerBubbles();
  }, [triggerBubbles]);

  const handlePress = useCallback(() => {
    if (onPress) onPress();
  }, [onPress]);

  return (
    <View style={styles.quizButtonWrapper}>
      {BUBBLE_POSITIONS.map((pos, i) => (
        <Bubble key={i} progress={progress} {...pos} />
      ))}
      <Pressable
        onPressIn={handlePressIn}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.quizButton,
          pressed && styles.quizButtonPressed,
        ]}>
        <Text style={styles.quizButtonText}>Quiz</Text>
      </Pressable>
    </View>
  );
}

function Bubble({
  x,
  y,
  progress,
}: {
  x: number;
  y: number;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const dist = 35 * progress.value;
    const opacity = Math.max(0, 0.7 - progress.value * 0.9);
    const scale = 0.2 + progress.value * 1.2;
    return {
      opacity,
      transform: [
        { translateX: x * dist },
        { translateY: y * dist },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.bubble, animatedStyle]}
      pointerEvents="none"
    />
  );
}

type ChatInputProps = {
  onSend: (message: string) => void;
  onQuizPress?: () => void;
};

/* UI rules: messageBox #2d2d2d, messageInput white, sendButton transparent */
export function ChatInput({ onSend, onQuizPress }: ChatInputProps) {
  const [message, setMessage] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const canSend = message.trim().length > 0;

  const handleSend = () => {
    if (canSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.container}>
        <View
          style={[
            styles.messageBox,
            isFocused && styles.messageBoxFocused,
          ]}>
          {!canSend && <QuizButton onPress={onQuizPress} />}

          <TextInput
            style={[
              styles.messageInput,
              Platform.OS === 'web' && { outlineStyle: 'none', boxShadow: 'none' } as any,
            ]}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            placeholderTextColor="rgb(136, 136, 136)"
            multiline={false}
            maxLength={1000}
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, canSend && styles.sendButtonCircle]}
            disabled={!canSend}>
            <IconSymbol
              name="arrow.up"
              size={18}
              color={canSend ? '#ffffff' : 'rgb(99, 99, 99)'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#000000',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  messageBoxFocused: {
    borderColor: 'rgb(110, 110, 110)',
  },
  quizButtonWrapper: {
    width: 56,
    height: 36,
    marginRight: 10,
    position: 'relative',
    overflow: 'visible',
  },
  quizButton: {
    width: 56,
    height: 36,
    borderRadius: 9999,
    backgroundColor: '#006BB3',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  quizButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bubble: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006BB3',
    left: 24,
    top: 14,
  },
  messageInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    paddingLeft: 10,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: '100%',
    minHeight: 36,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonCircle: {
    width: 36,
    height: 36,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#006BB3',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
