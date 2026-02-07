import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { eq, inArray } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardList, CardWithSourceNote } from '../components/CardList';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { sourceNotes } from '../db/models/sourcenote';
import { cardTags, tags as tagsTable } from '../db/models/tag';
import { deleteCards } from '../db/services';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

export default function AllCardsScreen() {
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
          intervalDays: cards.intervalDays,
          inReviewQueue: cards.inReviewQueue,
          extractionMethod: cards.extractionMethod,
          projectId: cards.projectId,
          sourceNoteTitle: sourceNotes.originalFileName,
        })
        .from(cards)
        .leftJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id));

      // Fetch tags for these cards
      const cardIds = data.map(c => c.id);
      let cardTagsMap: Record<number, string[]> = {};
      
      if (cardIds.length > 0) {
        const tagsData = await db
          .select({
            cardId: cardTags.cardId,
            tagName: tagsTable.name
          })
          .from(cardTags)
          .innerJoin(tagsTable, eq(cardTags.tagId, tagsTable.id))
          .where(inArray(cardTags.cardId, cardIds));

        for (const tag of tagsData) {
          if (!cardTagsMap[tag.cardId]) {
            cardTagsMap[tag.cardId] = [];
          }
          cardTagsMap[tag.cardId].push(tag.tagName);
        }
      }

      setCardList(
        data.map((row) => ({
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          lastSeen: row.lastSeen,
          timesSeen: row.timesSeen,
          intervalDays: row.intervalDays,
          inReviewQueue: row.inReviewQueue,
          extractionMethod: row.extractionMethod as ExtractionMethod,
          sourceNoteTitle: row.sourceNoteTitle || 'Unknown Source',
          tags: cardTagsMap[row.id] || [],
          projectId: row.projectId,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteCards = useCallback(async (cardIds: number[]) => {
    try {
      await deleteCards(cardIds);
      // Refresh the list after deletion
      await fetchCards();
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  }, [fetchCards]);

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
        <Text style={styles.headerTitle}>All Cards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <CardList 
        cardList={cardList} 
        loading={loading} 
        showFilters={true}
        emptyMessage="No cards found"
        emptySubtext="Try adjusting your filters"
        onDeleteCards={handleDeleteCards}
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
