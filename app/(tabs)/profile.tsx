// ProfileScreen.tsx (or your component file)
import { styles } from '@/components/profile/_ProfileScreen.styles'; // Import styles
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Subject {
  id: string;
  name: string;
  lastMessage: string;
  icon: string;
  progress: number;
}

// Progress Bar Component
const ProgressBar = ({ percentage }: { percentage: number }) => {
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.percentageText}>{percentage}%</Text>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage}%` },
          ]}
        />
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('http://localhost:8000/subjects');
        const data = await res.json();
        // data is an array of { id: number, name, lastMessage, icon, progress }
        const normalized = data.map((s: any) => ({
          id: String(s.id), // Subject.id is string in the UI
          name: s.name,
          lastMessage: s.lastMessage,
          icon: s.icon,
          progress: s.progress,
        }));
        setSubjects(normalized);

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c347791d-e2e3-4caf-a07a-d685939d1889', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'app/(tabs)/profile.tsx:useEffect',
            message: 'Fetched subjects',
            data: { count: normalized.length },
            timestamp: Date.now(),
            runId: 'pre-fix',
            hypothesisId: 'H1',
          }),
        }).catch(() => {});
        // #endregion
      } catch (e) {
        console.error('Failed to load subjects', e);

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c347791d-e2e3-4caf-a07a-d685939d1889', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'app/(tabs)/profile.tsx:useEffect',
            message: 'Failed to fetch subjects',
            data: { error: String(e) },
            timestamp: Date.now(),
            runId: 'pre-fix',
            hypothesisId: 'H2',
          }),
        }).catch(() => {});
        // #endregion
      }
    };

    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedSubjects([]);
    }
  };

  const toggleSubjectSelection = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter((subId) => subId !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>JD</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subjects</Text>
        </View>

        <TouchableOpacity style={styles.newSubjectButton} onPress={() => router.push('/chat')}>
          <Text style={styles.plusIcon}>+</Text>
          <Text style={styles.newSubjectText}>New subject</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <TextInput
            style={[
              styles.searchInput,
              { color: textColor },
              Platform.OS === 'web' && { outlineStyle: 'none', boxShadow: 'none' } as any,
            ]}
            placeholder="Search your subjects..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Subject Count and Select */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {subjects.length} subjects
        </Text>
        <TouchableOpacity onPress={toggleSelectMode}>
          <Text style={styles.selectText}>
            {isSelectMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subjects List */}
      <ScrollView
        style={styles.subjectsList}
        contentContainerStyle={styles.subjectsListContent}
      >
        {filteredSubjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={[
              styles.subjectItem,
              selectedSubjects.includes(subject.id) && styles.subjectItemSelected,
            ]}
            onPress={() => {
              if (isSelectMode) {
                toggleSubjectSelection(subject.id);
              } else {
                console.log('Navigate to subject:', subject.name);
              }
            }}
          >
            <View style={styles.subjectIconContainer}>
              <Text style={styles.subjectIcon}>{subject.icon}</Text>
            </View>

            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectLastMessage}>{subject.lastMessage}</Text>
            </View>

            {!isSelectMode && (
              <ProgressBar percentage={subject.progress} />
            )}

            {isSelectMode && (
              <View
                style={[
                  styles.checkbox,
                  selectedSubjects.includes(subject.id) && styles.checkboxSelected,
                ]}
              >
                {selectedSubjects.includes(subject.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Profile Section */}
      <View style={styles.bottomProfile}>
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileImageLarge}>
            <Text style={styles.profileImageText}>JD</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@email.com</Text>
          </View>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Text style={styles.actionButtonTextSecondary}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
