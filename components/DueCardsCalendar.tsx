import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { getCardsDueInMonth } from '../db/services';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DueCardsCalendarProps {
  userId: number;
}

export function DueCardsCalendar({ userId }: DueCardsCalendarProps) {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [dueCounts, setDueCounts] = useState<Map<string, number>>(new Map());

  const fetchDueData = useCallback(async () => {
    try {
      const data = await getCardsDueInMonth(userId, currentYear, currentMonth);
      setDueCounts(data);
    } catch (error) {
      console.error('Failed to fetch due cards data:', error);
    }
  }, [userId, currentYear, currentMonth]);

  useEffect(() => {
    fetchDueData();
  }, [fetchDueData]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleDatePress = (dateStr: string) => {
    router.push({
      pathname: '/due-cards' as any,
      params: { date: dateStr },
    });
  };

  // Build calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.text.base} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={22} color={Colors.text.base} />
        </TouchableOpacity>
      </View>

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
        {/* Empty slots for offset */}
        {emptySlots.map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = dueCounts.get(dateStr) || 0;
          const isToday =
            currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate();

          return (
            <TouchableOpacity
              key={day}
              style={styles.dayCell}
              onPress={() => handleDatePress(dateStr)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.circle,
                  count > 0 && styles.hasDueCircle,
                  isToday && styles.todayCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    count > 0 && styles.hasDueText,
                    isToday && count === 0 && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: Spacing['4'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  arrowButton: {
    padding: Spacing['2'],
  },
  monthTitle: {
    fontFamily: FontFamily.bold,
    ...Typography.lg,
    color: Colors.text.base,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing['2'],
  },
  dayHeaderCell: {
    width: '14.28%' as any,
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
    width: '14.28%' as any,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['0.5'],
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasDueCircle: {
    backgroundColor: Colors.primary.light4,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: Colors.primary.dark2,
  },
  dayNumber: {
    fontFamily: FontFamily.regular,
    ...Typography.sm,
    color: Colors.text.base,
  },
  hasDueText: {
    color: Colors.primary.dark5,
    fontFamily: FontFamily.bold,
  },
  todayText: {
    color: Colors.primary.base,
    fontFamily: FontFamily.bold,
  },
});
