import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { desc } from 'drizzle-orm';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { db } from '../db/client';
import { sourceNotes } from '../db/models/sourcenote';
import { deleteSourceNote } from '../db/services';
import { ContentModal } from './ContentModal';
import { TextMarkdownDisplay } from './TextMarkdownDisplay';

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i - 1];
}

interface SourceNoteListProps {
  limit?: number;
}

export function SourceNoteList({ limit }: SourceNoteListProps) {
  const [selectedNote, setSelectedNote] = useState<typeof sourceNotes.$inferSelect | null>(null);
  const [notes, setNotes] = useState<typeof sourceNotes.$inferSelect[]>([]);

  const fetchNotes = useCallback(async () => {
    try {
      let query = db.select().from(sourceNotes).orderBy(desc(sourceNotes.importDate));
      
      if (limit) {
        // @ts-ignore - drizzle's limit method type definition might not play nice with conditional chaining sometimes or if the query builder type changes
        // but let's try to construct it cleanly
         const data = await db.select().from(sourceNotes).orderBy(desc(sourceNotes.importDate)).limit(limit);
         setNotes(data);
      } else {
         const data = await db.select().from(sourceNotes).orderBy(desc(sourceNotes.importDate));
         setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch source notes:", error);
    }
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteSourceNote(id);
      fetchNotes();
    } catch (error) {
      console.error("Failed to delete source note:", error);
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>Source Notes</Text>

      {notes.length === 0 ? (
        <Text style={styles.emptyText}>No source notes yet</Text>
      ) : (
        <>
          {notes.map((item) => (
            <View key={item.id} style={styles.noteWrapper}>
              <ReanimatedSwipeable
                renderRightActions={() => renderRightActions(item.id)}
                containerStyle={styles.swipeableContainer}
              >
                <TouchableOpacity
                  style={styles.noteItem}
                  onPress={() => setSelectedNote(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.noteIcon}>
                    <Ionicons name="document-text-outline" size={24} color="#666" />
                  </View>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteName} numberOfLines={1}>{item.originalFileName}</Text>
                    <Text style={styles.noteMeta}>
                      {formatFileSize(item.fileSize)} • {formatRelativeDate(item.importDate)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              </ReanimatedSwipeable>
            </View>
          ))}
          {limit && notes.length > 0 && (
            <Link href="/all-source-notes" asChild>
              <TouchableOpacity style={styles.seeAllLink}>
                 <Text style={styles.seeAllText}>See all notes</Text>
              </TouchableOpacity>
            </Link>
          )}
        </>
      )}

      <ContentModal
        visible={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote?.originalFileName || 'Source Note'}
      >
        <TextMarkdownDisplay>{selectedNote?.rawContent || ''}</TextMarkdownDisplay>
      </ContentModal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    width: '100%',
  },
  sectionTitle: {
    ...Typography.lg,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing['4'],
    color: '#333',
  },
  noteWrapper: {
    marginBottom: Spacing['3'],
    borderRadius: 12,
    overflow: 'hidden', // Ensures swipe actions respect borderRadius if needed, but mainly keeps layout clean
  },
  swipeableContainer: {
    backgroundColor: '#dd2c00', // Matches delete action color for cleaner look during swipe
    borderRadius: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderRadius: 12,
    backgroundColor: '#f9f9f9',

  },
  deleteAction: {
    backgroundColor: '#dd2c00',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    // No margin or border radius needed here as it fills the container handled by Swipeable/Wrapper
  },
  noteIcon: {
    marginRight: Spacing['3'],
  },
  noteInfo: {
    flex: 1,
  },
  noteName: {
    ...Typography.base,
    fontFamily: FontFamily.bold,
    color: '#333',
    marginBottom: 2,
  },
  noteMeta: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: Spacing['8'],
    fontFamily: FontFamily.regular,
  },
  seeAllLink: {
    marginTop: Spacing['2'],
    alignItems: 'center',
    padding: Spacing['2'],
  },
  seeAllText: {
    ...Typography.sm,
    color: Colors.primary.base,
    fontFamily: FontFamily.regular,
  },
});
