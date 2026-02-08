import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ActionButton = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
};

const actionButtons: ActionButton[] = [
  { id: 'profile', label: 'Profile', icon: 'school' },
];

type LandingPageProps = {
  onActionPress?: (actionId: string) => void;
};

export function LandingPage({ onActionPress }: LandingPageProps) {
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

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {actionButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.actionButton}
            onPress={() => onActionPress?.(button.id)}>
            <MaterialIcons
              name={button.icon}
              size={18}
              color="#FFFFFF"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
