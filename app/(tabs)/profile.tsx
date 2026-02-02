import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
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
}

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', lastMessage: 'Last session 2 hours ago', icon: '🔢' },
  { id: '2', name: 'History', lastMessage: 'Last session 6 days ago', icon: '📚' },
  { id: '3', name: 'Physics', lastMessage: 'Last session 11 days ago', icon: '⚛️' },
  { id: '4', name: 'Chemistry', lastMessage: 'Last session 24 days ago', icon: '🧪' },
  { id: '5', name: 'Biology', lastMessage: 'Last session 1 month ago', icon: '🧬' },
  { id: '6', name: 'Literature', lastMessage: 'Last session 1 month ago', icon: '📖' },
];

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  plusIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  newSubjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: '#888',
  },
  selectText: {
    fontSize: 14,
    color: '#FF6A3D',
    fontWeight: '500',
  },
  subjectsList: {
    flex: 1,
  },
  subjectsListContent: {
    paddingBottom: 20,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    gap: 12,
  },
  subjectItemSelected: {
    backgroundColor: '#2A2A2A',
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIcon: {
    fontSize: 24,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subjectLastMessage: {
    fontSize: 14,
    color: '#888',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF6A3D',
    borderColor: '#FF6A3D',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomProfile: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#888',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6A3D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#2A2A2A',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
