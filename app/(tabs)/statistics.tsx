import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardCountsByProject, ProjectCardCount } from '../../components/CardCountsByProject';
import { Divider } from '../../components/Divider';
import { DailySwipesCountCard } from '../../components/statistics/DailySwipesCountCard';
import { ReviewQueueStatCard } from '../../components/statistics/ReviewQueueStatCard';
import { SessionList } from '../../components/statistics/SessionList';
import { StatisticCard } from '../../components/statistics/StatisticCard';
import { StreakDisplay } from '../../components/statistics/StreakDisplay';
import { WeekStreakIndicator } from '../../components/statistics/WeekStreakIndicator';
import { Colors } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { Session } from '../../db/models/session';
import { deleteAllSessions, getCardsInReviewQueueCount, getDailySwipesCount, getSessions, getTotalCardCount } from '../../db/services';
import { getProjectsWithCardCounts } from '../../db/services/projects';
import { calculateCurrentStreak, DayStreakData, getWeekStreakData } from '../../utils/streak';

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [dailySwipesCount, setDailySwipesCount] = useState(0);
  const [totalCardsCount, setTotalCardsCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weekStreakData, setWeekStreakData] = useState<DayStreakData[]>([]);
  const [projectCounts, setProjectCounts] = useState<ProjectCardCount[]>([]);
  const [cardsInReviewCount, setCardsInReviewCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchStatistics = async () => {
        if (user) {
          try {
            const [dailyCount, totalCount, userSessions, streak, weekData, projectsData, reviewCount] = await Promise.all([
              getDailySwipesCount(user.id),
              getTotalCardCount(user.id),
              getSessions(user.id),
              calculateCurrentStreak(user.id),
              getWeekStreakData(user.id),
              getProjectsWithCardCounts(user.id),
              getCardsInReviewQueueCount(user.id),
            ]);
            setDailySwipesCount(dailyCount);
            setTotalCardsCount(totalCount);
            setSessions(userSessions);
            setCurrentStreak(streak);
            setWeekStreakData(weekData);
            setProjectCounts(projectsData);
            setCardsInReviewCount(reviewCount);
          } catch (error) {
            console.error('Failed to fetch statistics:', error);
          }
        }
      };

      fetchStatistics();
    }, [user])
  );

  const handleDeleteAllSessions = async () => {
    Alert.alert(
      "Delete All Sessions",
      "Are you sure you want to delete all sessions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
             await deleteAllSessions();
             // Refresh data
             if (user) {
                const [dailyCount, totalCount, userSessions] = await Promise.all([
                  getDailySwipesCount(user.id),
                  getTotalCardCount(user.id),
                  getSessions(user.id),
                ]);
                setDailySwipesCount(dailyCount);
                setTotalCardsCount(totalCount);
                setSessions(userSessions);
             }
          }
        }
      ]
    );
  };

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

      <Divider style={{ marginVertical: 24 }} />

      <View style={styles.streakContainer}>
        <StreakDisplay streakCount={currentStreak} />
        <WeekStreakIndicator weekData={weekStreakData} />
      </View>

      <SessionList sessions={sessions} />
      {sessions.length > 0 && (
        <View>
          <TouchableOpacity 
            onPress={handleDeleteAllSessions}
            style={{ 
              backgroundColor: '#EF4444', 
              padding: 10, 
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete All Sessions</Text>
          </TouchableOpacity>
        </View>
      )}


      <Divider style={{ marginVertical: 24 }} />

      <CardCountsByProject 
        projectCounts={projectCounts} 
        title="Cards by Project"
        style={{ marginBottom: 16 }}
      />
      
      <ReviewQueueStatCard 
        count={cardsInReviewCount} 
        style={{ marginBottom: 32 }}
      />
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
  streakContainer: {
    marginBottom: 8,
    gap: 16,
  },
});
