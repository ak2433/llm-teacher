// ProfileScreen.tsx (or your component file)
import { styles } from '@/components/profile/_ProfileScreen.styles'; // Import styles
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', lastMessage: 'Last session 2 hours ago', icon: '🔢', progress: 100 },
  { id: '2', name: 'History', lastMessage: 'Last session 6 days ago', icon: '📚', progress: 75 },
  { id: '3', name: 'Physics', lastMessage: 'Last session 11 days ago', icon: '⚛️', progress: 60 },
  { id: '4', name: 'Chemistry', lastMessage: 'Last session 24 days ago', icon: '🧪', progress: 45 },
  { id: '5', name: 'Biology', lastMessage: 'Last session 1 month ago', icon: '🧬', progress: 30 },
  { id: '6', name: 'Literature', lastMessage: 'Last session 1 month ago', icon: '📖', progress: 85 },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const router = useRouter();

  const filteredSubjects = SUBJECTS.filter((subject) =>
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
          {SUBJECTS.length} subjects
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
