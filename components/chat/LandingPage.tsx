import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function LandingPage() {
  return (
    <View style={styles.container}>
      {/* Free plan badge */}
      <View style={styles.badgeContainer}>
        <TouchableOpacity style={styles.badge}>
          <Text style={styles.badgeText}>Free plan</Text>
          <Text style={styles.badgeSeparator}> • </Text>
          <Text style={[styles.badgeText, styles.badgeLink]}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome message */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIcon}>
          <Text style={styles.welcomeIconText}>✦</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome Back</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    paddingTop: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  badgeSeparator: {
    color: '#8E8E93',
  },
  badgeLink: {
    textDecorationLine: 'underline',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  welcomeIcon: {
    marginRight: 12,
  },
  welcomeIconText: {
    fontSize: 32,
    color: '#2872A1',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#CBDDE9',
  },
});
