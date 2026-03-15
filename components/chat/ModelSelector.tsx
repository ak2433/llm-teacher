import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

/* UI rules: #212121 surfaces, #ffffff text */
export function ModelSelector() {
  return (
    <TouchableOpacity style={styles.container}>
      <Text style={styles.text}>GPT-4</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
