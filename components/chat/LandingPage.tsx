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

/* UI rules: #212121 background, #ffffff text, primary #006BB3 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
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
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  badgeSeparator: {
    color: 'rgb(136, 136, 136)',
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
    color: '#006BB3',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
});
