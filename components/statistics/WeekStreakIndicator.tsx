import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { DayStreakData } from '../../utils/streak';

interface WeekStreakIndicatorProps {
  weekData: DayStreakData[];
}

export function WeekStreakIndicator({ weekData }: WeekStreakIndicatorProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View style={styles.container}>
      {weekData.map((day, index) => {
        const isToday = day.date.getTime() === today.getTime();
        const isFutureDay = day.date.getTime() > today.getTime();

        return (
          <View key={index} style={styles.dayContainer}>
            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day.dayAbbreviation}</Text>
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
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing['6'],
    paddingHorizontal: Spacing['4'],
    backgroundColor: Colors.background.card,
    borderRadius: 20,
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
  dayContainer: {
    alignItems: 'center',
    gap: Spacing['2'],
  },
  dayLabel: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.xs.fontSize,
    color: Colors.text.subtle,
  },
  todayLabel: {
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderColor: Colors.primary.dark2,
  },
  dateNumber: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: Colors.text.subtle,
  },
});
