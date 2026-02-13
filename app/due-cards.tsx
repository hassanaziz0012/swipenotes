import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardList, type CardWithSourceNote } from '../components/CardList';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { deleteCards, getCardsDueOnDate } from '../db/services';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

export default function DueCardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [cardList, setCardList] = useState<CardWithSourceNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!user || !date) return;
    try {
      setLoading(true);
      const [year, month, day] = date.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      const cards = await getCardsDueOnDate(user.id, targetDate);
      setCardList(cards);
    } catch (error) {
      console.error('Failed to fetch due cards:', error);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards])
  );

  const handleDeleteCards = useCallback(async (cardIds: number[]) => {
    try {
      await deleteCards(cardIds);
      await fetchCards();
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  }, [fetchCards]);

  const dateLabel = date ? formatDateLabel(date) : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.base} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{dateLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerStatus}>
            {loading ? '...' : `${cardList.length} card${cardList.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <CardList
        cardList={cardList}
        loading={loading}
        showFilters={true}
        emptyMessage="No cards due"
        emptySubtext="No cards are scheduled for review on this date"
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerStatus: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
});
