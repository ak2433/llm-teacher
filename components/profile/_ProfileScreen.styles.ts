import { Platform, StyleSheet } from 'react-native';

/* UI rules: #212121 background, #ffffff text, primary button rgb(0 107 179), messageBox #2d2d2d */
const PRIMARY_BLUE = '#006BB3';
const BORDER_LIGHT = 'rgba(255,255,255,0.3)';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(63, 63, 63)',
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
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  /* Primary/API button – UI rules */
  newSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    borderWidth: 3,
    borderColor: BORDER_LIGHT,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  plusIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  newSubjectText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  /* messageBox pattern – UI rules */
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgb(63, 63, 63)',
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
    color: '#ffffff',
  },
  selectText: {
    fontSize: 14,
    color: PRIMARY_BLUE,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    borderBottomColor: 'rgb(63, 63, 63)',
    gap: 12,
  },
  subjectItemSelected: {
    backgroundColor: '#2d2d2d',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  subjectLastMessage: {
    fontSize: 14,
    color: 'rgb(136, 136, 136)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    minWidth: 100,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 32,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
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
    borderTopColor: 'rgb(63, 63, 63)',
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
    backgroundColor: PRIMARY_BLUE,
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
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgb(136, 136, 136)',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: PRIMARY_BLUE,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
