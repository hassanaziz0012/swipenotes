import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DailySwipesCountCard } from '../../components/statistics/DailySwipesCountCard';
import { SessionList } from '../../components/statistics/SessionList';
import { StatisticCard } from '../../components/statistics/StatisticCard';
import { Colors } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { Session } from '../../db/models/session';
import { getDailySwipesCount, getSessions, getTotalCardCount } from '../../db/services';

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [dailySwipesCount, setDailySwipesCount] = useState(0);
  const [totalCardsCount, setTotalCardsCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchStatistics = async () => {
        if (user) {
          try {
            const [dailyCount, totalCount, userSessions] = await Promise.all([
              getDailySwipesCount(user.id),
              getTotalCardCount(user.id),
              getSessions(user.id),
            ]);
            setDailySwipesCount(dailyCount);
            setTotalCardsCount(totalCount);
            setSessions(userSessions);
          } catch (error) {
            console.error('Failed to fetch statistics:', error);
          }
        }
      };

      fetchStatistics();
    }, [user])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.cardsContainer}>
        <DailySwipesCountCard count={dailySwipesCount} />
        <StatisticCard 
          title="Total Cards" 
          count={totalCardsCount} 
          iconName="layers" 
          iconColor={Colors.primary.base}
        />
      </View>
      <SessionList sessions={sessions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background.base,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
    color: Colors.text.base,
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
