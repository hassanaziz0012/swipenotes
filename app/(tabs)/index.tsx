import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ForgottenGems } from '../../components/ForgottenGems';
import { GlobalSearch } from '../../components/GlobalSearch';
import { QuickActionsRow } from '../../components/QuickActionsRow';
import { RecentImports } from '../../components/RecentImports';
import { StreakDisplay } from '../../components/statistics/StreakDisplay';
import { WeekStreakIndicator } from '../../components/statistics/WeekStreakIndicator';
import { TodayStatus } from '../../components/TodayStatus';
import { Colors, Spacing } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { calculateCurrentStreak, DayStreakData, getWeekStreakData } from '../../utils/streak';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weekStreakData, setWeekStreakData] = useState<DayStreakData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchStreakData = async () => {
        if (user) {
          try {
            const [streak, weekData] = await Promise.all([
              calculateCurrentStreak(user.id),
              getWeekStreakData(user.id),
            ]);
            setCurrentStreak(streak);
            setWeekStreakData(weekData);
          } catch (error) {
            console.error('Failed to fetch streak data:', error);
          }
        }
      };

      fetchStreakData();
    }, [user])
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <GlobalSearch />

        <View style={styles.todayStatusSection}>
          <TodayStatus />
        </View>

        <View style={styles.quickActionsSection}>
          <QuickActionsRow />
        </View>

        <View style={styles.streakSection}>
          <TouchableOpacity onPress={() => router.push('/streak-details')} activeOpacity={1}>
            <StreakDisplay streakCount={currentStreak} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/streak-details')} activeOpacity={1}>
            <WeekStreakIndicator weekData={weekStreakData} />
          </TouchableOpacity>
        </View>

        <View style={styles.recentImportsSection}>
          <RecentImports />
        </View>

        <View style={styles.forgottenGemsSection}>
          <ForgottenGems />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: Spacing['5'],
    paddingBottom: Spacing['12'],
  },
  todayStatusSection: {
    marginTop: Spacing['5'],
  },
  quickActionsSection: {
    marginTop: Spacing['4'],
  },
  streakSection: {
    marginTop: Spacing['4'],
    gap: 16,
  },
  recentImportsSection: {
    marginTop: Spacing['4'],
  },
  forgottenGemsSection: {
    marginTop: Spacing['4'],
  },
});

