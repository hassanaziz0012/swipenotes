import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardList, CardWithSourceNote } from '../components/CardList';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { sourceNotes } from '../db/models/sourcenote';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

export default function ReviewQueueScreen() {
  const router = useRouter();
  const [cardList, setCardList] = useState<CardWithSourceNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await db
        .select({
          id: cards.id,
          content: cards.content,
          createdAt: cards.createdAt,
          lastSeen: cards.lastSeen,
          timesSeen: cards.timesSeen,
          inReviewQueue: cards.inReviewQueue,
          extractionMethod: cards.extractionMethod,
          tags: cards.tags,
          projectId: cards.projectId,
          sourceNoteTitle: sourceNotes.originalFileName,
        })
        .from(cards)
        .leftJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id))
        .where(eq(cards.inReviewQueue, true));

      setCardList(
        data.map((row) => ({
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          lastSeen: row.lastSeen,
          timesSeen: row.timesSeen,
          inReviewQueue: row.inReviewQueue,
          extractionMethod: row.extractionMethod as ExtractionMethod,
          sourceNoteTitle: row.sourceNoteTitle || 'Unknown Source',
          tags: row.tags || [],
          projectId: row.projectId,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch review queue cards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.base} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Queue</Text>
        <View style={styles.headerSpacer} />
      </View>

      <CardList 
        cardList={cardList} 
        loading={loading} 
        showFilters={true}
        emptyMessage="Review queue is empty"
        emptySubtext="No cards are currently in your review queue"
        onCardUpdated={fetchCards}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  backButton: {
    padding: Spacing['2'],
    marginLeft: -Spacing['2'],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.xl.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  headerSpacer: {
    width: 40,
  },
});
