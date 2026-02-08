import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { Session } from '../../db/models/session';
import { getProjectById } from '../../db/services';
import SessionReview, { ProjectCount } from '../SessionReview';
import { SessionItem } from './SessionItem';

interface SessionListProps {
  sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projectCounts, setProjectCounts] = useState<ProjectCount[]>([]);
  const [loadingProjectCounts, setLoadingProjectCounts] = useState(false);

  // Fetch project counts when a session is selected
  useEffect(() => {
    const fetchProjectCounts = async () => {
      if (!selectedSession || !selectedSession.swipeHistory) {
        setProjectCounts([]);
        return;
      }

      setLoadingProjectCounts(true);
      try {
        const swipeHistory = selectedSession.swipeHistory as any[];
        const cards = selectedSession.cards as any[] || [];
        
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

    fetchProjectCounts();
  }, [selectedSession]);

  const handleSessionPress = (session: Session) => {
    if (session.isActive) {
      router.push({
        pathname: "/swipe-session",
        params: { sessionId: session.id }
      });
    } else {
      // Open modal for inactive sessions
      setSelectedSession(session);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sessions yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Sessions</Text>
      {sessions.map((session) => (
        <TouchableOpacity 
          key={session.id} 
          onPress={() => handleSessionPress(session)}
          activeOpacity={0.7}
        >
          <SessionItem session={session} />
        </TouchableOpacity>
      ))}

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
    marginTop: Spacing[4],
  },
  title: {
    ...Typography.lg,
    fontWeight: 'bold',
    marginBottom: Spacing[2],
    color: Colors.text.base,
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

