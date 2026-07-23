import { styles } from '@/components/profile/_ProfileScreen.styles';
import { AppNavMenu } from '@/components/navigation/AppNavMenu';
import { API_URL } from '@/constants/api';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet as RNStyleSheet,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Subject {
  id: string;
  name: string;
  lastMessage: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/subjects`);
      const data = await res.json();
      const normalized = data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        lastMessage: s.lastMessage,
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

  const handleDeleteSelected = () => {
    if (selectedSubjects.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    const idsToDelete = [...selectedSubjects];
    if (idsToDelete.length === 0) {
      setShowDeleteConfirm(false);
      return;
    }
    setIsDeleting(true);
    try {
      for (const id of idsToDelete) {
        const res = await fetch(`${API_URL}/subjects/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Delete failed (${res.status})`);
        }
      }
      setSelectedSubjects([]);
      setIsSelectMode(false);
      setShowDeleteConfirm(false);
      await fetchSubjects();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete subjects. Please try again.');
    } finally {
      setIsDeleting(false);
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
    <SafeAreaView style={[styles.container, pageStyles.navHost]} edges={['top']}>
      <StatusBar style="light" />
      <AppNavMenu />
      <View style={pageStyles.outerWrapper}>
        <View style={pageStyles.centeredColumn}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Subjects</Text>

            <TouchableOpacity style={styles.newSubjectButton} onPress={() => router.push('/new-subject')}>
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
                  { color: '#ffffff' },
                  Platform.OS === 'web' && { outlineStyle: 'none', boxShadow: 'none' } as any,
                ]}
                placeholder="Search your subjects..."
                placeholderTextColor="rgb(136, 136, 136)"
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
            <View style={pageStyles.selectActions}>
              {isSelectMode && selectedSubjects.length > 0 && (
                <TouchableOpacity
                  onPress={handleDeleteSelected}
                  disabled={isDeleting}
                  style={pageStyles.deleteBtn}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#2196f3" />
                  ) : (
                    <Text style={pageStyles.deleteBtnText}>Delete</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleSelectMode}>
                <Text style={styles.selectText}>
                  {isSelectMode ? 'Cancel' : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
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

        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Delete Subjects</Text>
            <Text style={modalStyles.subtitle}>
              Are you sure you want to delete {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''}? This cannot be undone.
            </Text>
            <View style={modalStyles.deleteModalActions}>
              <TouchableOpacity
                style={modalStyles.deleteModalCancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.deleteConfirmBtn}
                onPress={confirmDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.deleteConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const pageStyles = RNStyleSheet.create({
  navHost: {
    position: 'relative',
  },
  outerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  centeredColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
  },
  selectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteBtn: {
    minWidth: 60,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
});

/* Modal styles – UI rules: card #212121, primary #006BB3, secondary transparent */
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
    backgroundColor: '#212121',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 15, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgb(170, 170, 170)',
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  primaryBtn: {
    backgroundColor: '#006BB3',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'rgb(136, 136, 136)',
    fontSize: 14,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteConfirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
