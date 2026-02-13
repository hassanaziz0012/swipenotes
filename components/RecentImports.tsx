import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { sourceNotes } from '../db/models/sourcenote';
import { getRecentSourceNotes } from '../db/services/sourceNotes';
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

interface RecentImportsProps {
  limit?: number;
}

export function RecentImports({ limit = 5 }: RecentImportsProps) {
  const [selectedNote, setSelectedNote] = useState<typeof sourceNotes.$inferSelect | null>(null);
  const [notes, setNotes] = useState<typeof sourceNotes.$inferSelect[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchNotes = async () => {
        try {
          const data = await getRecentSourceNotes(limit);
          setNotes(data);
        } catch (error) {
          console.error('Failed to fetch recent source notes:', error);
        }
      };
      fetchNotes();
    }, [limit])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Imports</Text>

      {notes.length === 0 ? (
        <Text style={styles.emptyText}>No imports yet</Text>
      ) : (
        notes.map((item) => (
          <TouchableOpacity
            key={item.id}
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
        ))
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
  container: {
    width: '100%',
  },
  sectionTitle: {
    ...Typography.lg,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing['4'],
    color: Colors.text.base,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderRadius: 12,
    backgroundColor: Colors.background.card,
    marginBottom: Spacing['3'],
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
    color: Colors.text.base,
    marginBottom: 2,
  },
  noteMeta: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.subtle,
    marginTop: Spacing['8'],
    fontFamily: FontFamily.regular,
  },
});
