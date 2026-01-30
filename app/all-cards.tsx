import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardListItem } from '../components/CardListItem';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { sourceNotes } from '../db/models/sourcenote';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

interface CardWithSourceNote {
  id: number;
  content: string;
  createdAt: Date;
  lastSeen: Date | null;
  timesSeen: number;
  inReviewQueue: boolean;
  extractionMethod: ExtractionMethod;
  sourceNoteTitle: string;
}

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
          inReviewQueue: cards.inReviewQueue,
          extractionMethod: cards.extractionMethod,
          sourceNoteTitle: sourceNotes.originalFileName,
        })
        .from(cards)
        .leftJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id));

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
        }))
      );
    } catch (error) {
      console.error('Failed to fetch cards:', error);
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
        <Text style={styles.headerTitle}>All Cards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <Text style={styles.loadingText}>Loading cards...</Text>
        ) : cardList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color={Colors.text.subtle} />
            <Text style={styles.emptyText}>No cards yet</Text>
            <Text style={styles.emptySubtext}>Import a source note to create cards</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardCount}>{cardList.length} card{cardList.length !== 1 ? 's' : ''}</Text>
            {cardList.map((card) => (
              <CardListItem
                key={card.id}
                content={card.content}
                sourceNoteTitle={card.sourceNoteTitle}
                createdAt={card.createdAt}
                lastSeen={card.lastSeen}
                timesSeen={card.timesSeen}
                inReviewQueue={card.inReviewQueue}
                extractionMethod={card.extractionMethod}
              />
            ))}
          </>
        )}
      </ScrollView>
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
  container: {
    padding: Spacing['4'],
    paddingBottom: Spacing['8'],
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.text.subtle,
    marginTop: Spacing['8'],
    fontFamily: FontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing['16'],
  },
  emptyText: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    marginTop: Spacing['4'],
  },
  emptySubtext: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    marginTop: Spacing['2'],
  },
  cardCount: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    marginBottom: Spacing['4'],
  },
});
