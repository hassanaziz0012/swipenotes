import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StreakCalendar } from '../components/statistics/StreakCalendar';
import { StreakDisplay } from '../components/statistics/StreakDisplay';
import { Colors, Spacing } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { calculateCurrentStreak } from '../utils/streak';

export default function StreakDetailsScreen() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      const fetchStreak = async () => {
        if (user) {
          try {
            const streak = await calculateCurrentStreak(user.id);
            setCurrentStreak(streak);
          } catch (error) {
            console.error('Failed to fetch streak data:', error);
          }
        }
      };
      fetchStreak();
    }, [user])
  );

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.streakDisplayContainer}>
        <StreakDisplay streakCount={currentStreak} />
      </View>

      <StreakCalendar
        userId={user.id}
        initialYear={today.getFullYear()}
        initialMonth={today.getMonth()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },
  contentContainer: {
    padding: Spacing['4'],
    paddingTop: Spacing['12'],
  },
  streakDisplayContainer: {
    marginBottom: Spacing['4'],
  },
});
