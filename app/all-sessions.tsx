import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SessionReview, { ProjectCount } from '../components/SessionReview';
import { SessionItem } from '../components/statistics/SessionItem';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { Session } from '../db/models/session';
import { getProjectById, getSessions } from '../db/services';

export default function AllSessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projectCounts, setProjectCounts] = useState<ProjectCount[]>([]);
  const [loadingProjectCounts, setLoadingProjectCounts] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchSessions = async () => {
        if (user) {
          try {
            setLoading(true);
            const userSessions = await getSessions(user.id);
            setSessions(userSessions);
          } catch (error) {
            console.error('Failed to fetch sessions:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchSessions();
    }, [user])
  );

  // Fetch project counts when a session is selected
  const fetchProjectCounts = async (session: Session) => {
    if (!session || !session.swipeHistory) {
      setProjectCounts([]);
      return;
    }

    setLoadingProjectCounts(true);
    try {
      const swipeHistory = session.swipeHistory as any[];
      const cards = session.cards as any[] || [];
      
      // Build a map of cardId -> card
      const cardMap = new Map<number, any>();
      cards.forEach(card => cardMap.set(card.id, card));

      // Compute project counts from swipe history
      const projectCountsMap = new Map<number, { project: { id: number; name: string; color: string }; count: number }>();
      const projectCache = new Map<number, { id: number; name: string; color: string }>();

      for (const swipe of swipeHistory) {
        const card = cardMap.get(swipe.cardId);
        if (card && card.projectId) {
          let project = projectCache.get(card.projectId);
          if (!project) {
            const fetchedProject = await getProjectById(card.projectId);
            if (fetchedProject) {
              project = { id: fetchedProject.id, name: fetchedProject.name, color: fetchedProject.color };
              projectCache.set(card.projectId, project);
            }
          }
          
          if (project) {
            const existing = projectCountsMap.get(project.id);
            if (existing) {
              existing.count += 1;
            } else {
              projectCountsMap.set(project.id, { project, count: 1 });
            }
          }
        }
      }

      const counts = Array.from(projectCountsMap.values()).sort((a, b) => b.count - a.count);
      setProjectCounts(counts);
    } catch (error) {
      console.error('Failed to fetch project counts:', error);
      setProjectCounts([]);
    } finally {
      setLoadingProjectCounts(false);
    }
  };

  const handleSessionPress = async (session: Session) => {
    if (session.isActive) {
      router.push({
        pathname: "/swipe-session",
        params: { sessionId: session.id }
      });
    } else {
      // Open modal for inactive sessions
      setSelectedSession(session);
      setShowModal(true);
      await fetchProjectCounts(session);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.base} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.base} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Sessions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions yet.</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <TouchableOpacity 
              key={session.id} 
              onPress={() => handleSessionPress(session)}
              activeOpacity={0.7}
            >
              <SessionItem session={session} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Session Review Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Review</Text>
              <Pressable 
                onPress={handleCloseModal} 
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.text.base} />
              </Pressable>
            </View>
            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
            >
              {loadingProjectCounts ? (
                <ActivityIndicator size="large" color={Colors.primary.base} />
              ) : selectedSession ? (
                <SessionReview 
                  session={selectedSession} 
                  projectCounts={projectCounts}
                  containerStyle={{ alignItems: 'center' }}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[12],
    paddingBottom: Spacing[4],
    backgroundColor: Colors.background.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.xl,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
  emptyContainer: {
    padding: Spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.base,
    color: Colors.text.subtle,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  modalTitle: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    flex: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
});
