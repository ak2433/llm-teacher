import { styles } from '@/components/profile/_ProfileScreen.styles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = Platform.select({
  ios: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  default: 'http://10.0.0.23:8000',
});

interface Subject {
  id: string;
  name: string;
  lastMessage: string;
  icon: string;
  progress: number;
}

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
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const router = useRouter();

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/subjects`);
      const data = await res.json();
      const normalized = data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        lastMessage: s.lastMessage,
        icon: s.icon,
        progress: s.progress,
      }));
      setSubjects(normalized);
    } catch (e) {
      console.error('Failed to load subjects', e);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

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

  const createSubjectAndNavigate = async (name: string) => {
    const res = await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.status === 409) {
      const data = await res.json();
      Alert.alert(
        'Subject Exists',
        `${data.detail}\n\nWould you like to delete the old one and create a new one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              const listRes = await fetch(`${API_URL}/subjects`);
              const subjects = await listRes.json();
              const existing = subjects.find(
                (s: any) => s.name.toLowerCase() === name.toLowerCase(),
              );
              if (existing) {
                await fetch(`${API_URL}/subjects/${existing.id}`, { method: 'DELETE' });
              }
              createSubjectAndNavigate(name);
            },
          },
        ],
      );
      return;
    }

    if (!res.ok) throw new Error('Failed to create subject');

    const created = await res.json();
    setShowNewSubjectModal(false);
    setNewSubjectName('');

    router.push({
      pathname: '/chat',
      params: {
        subjectId: String(created.id),
        subjectName: created.name,
        isNewSubject: 'true',
      },
    });
  };

  const handleCreateSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) return;

    try {
      await createSubjectAndNavigate(name);
    } catch (e) {
      Alert.alert('Error', 'Failed to create subject. Is the backend running?');
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      const res = await fetch(`${API_URL}/subjects/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const created = await res.json();
      setIsUploading(false);

      router.push({
        pathname: '/chat',
        params: {
          subjectId: String(created.id),
          subjectName: created.name,
          isNewSubject: 'true',
        },
      });
    } catch (e: any) {
      setIsUploading(false);
      Alert.alert('Upload Error', e.message || 'Failed to upload file.');
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

        <TouchableOpacity style={styles.newSubjectButton} onPress={() => setShowNewSubjectModal(true)}>
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
                router.push({
                  pathname: '/chat',
                  params: { subjectId: subject.id, subjectName: subject.name },
                });
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

      {/* New Subject Modal */}
      <Modal visible={showNewSubjectModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>New Subject</Text>
            <Text style={modalStyles.subtitle}>What would you like to learn?</Text>

            <TextInput
              style={modalStyles.input}
              placeholder="e.g. Linear Algebra, World History..."
              placeholderTextColor="#888"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
              onSubmitEditing={handleCreateSubject}
            />

            <TouchableOpacity style={modalStyles.primaryBtn} onPress={handleCreateSubject}>
              <Text style={modalStyles.primaryBtnText}>Start Learning</Text>
            </TouchableOpacity>

            <TouchableOpacity style={modalStyles.secondaryBtn} onPress={handleUploadFile}>
              {isUploading ? (
                <ActivityIndicator color="#A78BFA" />
              ) : (
                <Text style={modalStyles.secondaryBtnText}>Upload a Document Instead</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={() => {
                setShowNewSubjectModal(false);
                setNewSubjectName('');
              }}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = RNStyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  primaryBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  secondaryBtnText: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 14,
  },
});
