import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { Session } from '../../db/models/session';
import { getProjectCountsForSession } from '../../db/services/projects';
import { getSessionsByDate } from '../../db/services/session';
import { DayStreakData, getMonthStreakData } from '../../utils/streak';
import { ContentModal } from '../ContentModal';
import SessionReview, { ProjectCount } from '../SessionReview';

interface StreakCalendarProps {
  userId: number;
  initialYear: number;
  initialMonth: number; // 0-indexed
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MonthGridProps {
  monthData: DayStreakData[];
  year: number;
  month: number;
  onDayPress: (date: Date, hasStudied: boolean) => void;
}

function MonthGrid({ monthData, year, month, onDayPress }: MonthGridProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  return (
    <View style={styles.monthContainer}>
      {/* Day Headers */}
      <View style={styles.dayHeadersRow}>
        {DAY_HEADERS.map((day, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {/* Empty slots */}
        {emptySlots.map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {monthData.map((day, index) => {
          const isToday = day.date.getTime() === today.getTime();
          const isFutureDay = day.date.getTime() > today.getTime();

          return (
            <TouchableOpacity 
              key={index} 
              style={styles.dayCell}
              onPress={() => onDayPress(day.date, day.hasStudied)}
              activeOpacity={day.hasStudied ? 0.7 : 1}
            >
              {day.hasStudied ? (
                <View style={[styles.circle, styles.studiedCircle, isToday && styles.todayCircle]}>
                  <Ionicons name="checkmark" size={16} color={Colors.background.card} />
                </View>
              ) : (
                <View style={[
                  styles.circle,
                  isFutureDay ? styles.futureCircle : styles.missedCircle,
                  isToday && styles.todayCircle
                ]}>
                  {!isFutureDay && (
                    <Text style={styles.dateNumber}>{day.dayNumber}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function getAdjacentMonth(year: number, month: number, offset: number): { year: number; month: number } {
  let newMonth = month + offset;
  let newYear = year;

  if (newMonth < 0) {
    newMonth = 11;
    newYear -= 1;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear += 1;
  }

  return { year: newYear, month: newMonth };
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function StreakCalendar({ userId, initialYear, initialMonth }: StreakCalendarProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentMonthData, setCurrentMonthData] = useState<DayStreakData[]>([]);
  
  // Cache to store fetched month data
  const monthCache = useRef<Map<string, DayStreakData[]>>(new Map());

  // Fetch a single month's data, using cache if available
  const fetchMonthData = useCallback(async (year: number, month: number) => {
    const key = getMonthKey(year, month);
    if (monthCache.current.has(key)) {
      setCurrentMonthData(monthCache.current.get(key)!);
      return;
    }
    try {
      const data = await getMonthStreakData(userId, year, month);
      monthCache.current.set(key, data);
      setCurrentMonthData(data);
    } catch (error) {
      console.error('Failed to fetch month data:', error);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    fetchMonthData(currentYear, currentMonth);
  }, []); // Only run on mount to load initial data. Navigation handles updates.

  const handlePrev = useCallback(() => {
    const { year, month } = getAdjacentMonth(currentYear, currentMonth, -1);
    setCurrentYear(year);
    setCurrentMonth(month);
    fetchMonthData(year, month);
  }, [currentYear, currentMonth, fetchMonthData]);

  const [selectedSessions, setSelectedSessions] = useState<{ session: Session; projectCounts: ProjectCount[] }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // ... existing code ...

  const handleNext = useCallback(() => {
    const { year, month } = getAdjacentMonth(currentYear, currentMonth, 1);
    setCurrentYear(year);
    setCurrentMonth(month);
    fetchMonthData(year, month);
  }, [currentYear, currentMonth, fetchMonthData]);

  const handleDayPress = useCallback(async (date: Date, hasStudied: boolean) => {
    if (!hasStudied) return;

    setLoadingSessions(true);
    setModalVisible(true);
    try {
      const sessions = await getSessionsByDate(userId, date);
      const sessionsWithCounts = await Promise.all(
        sessions.map(async (session) => {
          const projectCounts = await getProjectCountsForSession(session);
          return { session, projectCounts };
        })
      );
      setSelectedSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, [userId]);

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedSessions([]);
  };

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrev} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.base} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
        
        <TouchableOpacity onPress={handleNext} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.text.base} />
        </TouchableOpacity>
      </View>


      <MonthGrid monthData={currentMonthData} year={currentYear} month={currentMonth} onDayPress={handleDayPress} />



      <ContentModal
        visible={modalVisible}
        onClose={handleCloseModal}
        title="Session Review"
      >
        {loadingSessions ? (
            <ActivityIndicator size="large" color={Colors.primary.base} />
        ) : (
            selectedSessions.map((item, index) => (
                <View key={item.session.id} style={styles.sessionContainer}>
                    {index > 0 && <View style={styles.separator} />}
                    <Text style={styles.sessionTime}>
                        {new Date(item.session.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>

                    <SessionReview 
                        session={item.session} 
                        projectCounts={item.projectCounts}
                        containerStyle={{ alignItems: 'center' }}
                    />
                </View>
            ))
        )}
      </ContentModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: Spacing['4'],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  monthTitle: {
    fontFamily: FontFamily.bold,
    ...Typography.lg,
    color: Colors.text.base,
  },
  arrowButton: {
    padding: Spacing['2'],
  },
  monthContainer: {},
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing['2'],
  },
  dayHeaderCell: {
    width: 36,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: FontFamily.bold,
    ...Typography.xs,
    color: Colors.text.subtle,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['0.5'],
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studiedCircle: {
    backgroundColor: Colors.primary.base,
  },
  missedCircle: {
    backgroundColor: Colors.primary.light5,
  },
  futureCircle: {
    backgroundColor: Colors.border.subtle,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: Colors.primary.dark2,
  },
  dateNumber: {
    fontFamily: FontFamily.regular,
    ...Typography.xs,
    color: Colors.text.subtle,
  },
  sessionContainer: {
    marginBottom: Spacing[6],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing[4],
  },
  sessionTime: {
    ...Typography.sm,
    color: Colors.text.subtle,
    marginBottom: Spacing[2],
    fontFamily: FontFamily.regular,
  },
});
