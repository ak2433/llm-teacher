import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const DRAWER_WIDTH = 280;

type AppNavMenuProps = {
  subjectId?: string;
  subjectName?: string;
};

function TwoLineMenuIcon() {
  return (
    <View style={styles.menuIcon}>
      <View style={styles.menuLine} />
      <View style={[styles.menuLine, styles.menuLineShort]} />
    </View>
  );
}

export function AppNavMenu({ subjectId, subjectName }: AppNavMenuProps) {
  const router = useRouter();
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const drawerSlide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(drawerSlide, {
        toValue: navMenuOpen ? 0 : -DRAWER_WIDTH,
        duration: navMenuOpen ? 260 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: navMenuOpen ? 1 : 0,
        duration: navMenuOpen ? 260 : 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [navMenuOpen, drawerSlide, backdropOpacity]);

  const goToProfile = () => {
    setNavMenuOpen(false);
    router.push('/profile');
  };

  const goToSyllabus = () => {
    setNavMenuOpen(false);
    if (!subjectId) {
      Alert.alert('Outline', 'Open a subject chat first.');
      return;
    }
    router.push({
      pathname: '/syllabus-outline',
      params: {
        subjectId,
        subjectName: subjectName ?? '',
      },
    });
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuBtn}
        accessibilityRole="button"
        accessibilityLabel={navMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onPress={() => setNavMenuOpen((open) => !open)}
        activeOpacity={0.7}
      >
        <TwoLineMenuIcon />
      </TouchableOpacity>

      <View
        style={styles.drawerLayer}
        pointerEvents={navMenuOpen ? 'box-none' : 'none'}
      >
        <Animated.View
          style={[styles.navBackdrop, { opacity: backdropOpacity }]}
          pointerEvents={navMenuOpen ? 'auto' : 'none'}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setNavMenuOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close navigation menu"
          />
        </Animated.View>
        <Animated.View
          style={[styles.drawerPanel, { transform: [{ translateX: drawerSlide }] }]}
          pointerEvents={navMenuOpen ? 'auto' : 'none'}
        >
          <View style={styles.drawerProfileRow}>
            <View style={styles.drawerProfileAvatar}>
              <Text style={styles.profileAvatarText}>JD</Text>
            </View>
            <Text style={styles.drawerProfileName}>John Doe</Text>
          </View>
          <View style={styles.drawerDivider} />
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={goToProfile}
            accessibilityRole="button"
            accessibilityLabel="Subjects"
          >
            <MaterialIcons name="grid-view" size={24} color="#ffffff" />
            <Text style={styles.drawerItemLabel}>Subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={goToSyllabus}
            accessibilityRole="button"
            accessibilityLabel="Syllabus"
          >
            <MaterialIcons name="toc" size={24} color="#ffffff" />
            <Text style={styles.drawerItemLabel}>Syllabus</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 120,
    padding: 10,
  },
  menuIcon: {
    width: 22,
    height: 12,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    width: 22,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  menuLineShort: {
    width: 16,
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  navBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#212121',
    paddingTop: 56,
    paddingHorizontal: 20,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgb(63, 63, 63)',
  },
  drawerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  drawerProfileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#006BB3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerProfileName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  drawerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgb(63, 63, 63)',
    marginBottom: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  drawerItemLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
  },
});
