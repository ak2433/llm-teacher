import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ModelSelector() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}>
      <Text
        style={[
          styles.text,
          isDark ? styles.textDark : styles.textLight,
        ]}>
        GPT-4
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  containerLight: {
    backgroundColor: '#E5E5EA',
  },
  containerDark: {
    backgroundColor: '#2C2C2E',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textLight: {
    color: '#000000',
  },
  textDark: {
    color: '#FFFFFF',
  },
});
