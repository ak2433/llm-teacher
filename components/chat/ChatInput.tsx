import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ChatInputProps = {
  onSend: (message: string) => void;
};

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canSend = message.trim().length > 0;
  const textColor = isDark ? '#FFFFFF' : '#000000';

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
      <View
        style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight,
        ]}>
        <View
          style={[
            styles.inputContainer,
            isDark ? styles.inputContainerDark : styles.inputContainerLight,
          ]}>
          <IconSymbol
            name="plus"
            size={20}
            color={isDark ? '#8E8E93' : '#8E8E93'}
            style={styles.leftIcon}
          />

          <TextInput
            style={[styles.input, { color: textColor }]}
            value={message}
            onChangeText={setMessage}
            placeholder="How can I help you today?"
            placeholderTextColor="#8E8E93"
            multiline={false}
            maxLength={1000}
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            disabled={!canSend}>
            <IconSymbol
              name="arrow.up"
              size={18}
              color={canSend ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
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
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  containerLight: {
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    borderTopColor: '#2C2C2E',
    backgroundColor: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  inputContainerLight: {
    backgroundColor: '#F2F2F7',
  },
  inputContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  leftIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF6A3D',
  },
  sendButtonInactive: {
    backgroundColor: '#2C2C2E',
  },
});
