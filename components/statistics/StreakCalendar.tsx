import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { DayStreakData, getMonthStreakData } from '../../utils/streak';

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
const SWIPE_THRESHOLD = 50;

interface MonthGridProps {
  monthData: DayStreakData[];
  year: number;
  month: number;
}

function MonthGrid({ monthData, year, month }: MonthGridProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptySlots = Array(firstDayOfMonth).fill(null);

  return (
    <View style={styles.monthContainer}>
      {/* Month Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
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
        {/* Empty slots */}
        {emptySlots.map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {monthData.map((day, index) => {
          const isToday = day.date.getTime() === today.getTime();
          const isFutureDay = day.date.getTime() > today.getTime();

          return (
            <View key={index} style={styles.dayCell}>
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
  const screenWidth = Dimensions.get('window').width - Spacing['4'] * 2 - Spacing['4'] * 2;
  const translateX = useSharedValue(0);
  
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [isReady, setIsReady] = useState(false);
  
  // Cache to store fetched month data
  const monthCache = useRef<Map<string, DayStreakData[]>>(new Map());
  
  const [prevMonthData, setPrevMonthData] = useState<DayStreakData[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<DayStreakData[]>([]);
  const [nextMonthData, setNextMonthData] = useState<DayStreakData[]>([]);

  const prev = getAdjacentMonth(currentYear, currentMonth, -1);
  const next = getAdjacentMonth(currentYear, currentMonth, 1);

  // Fetch a single month's data, using cache if available
  const fetchMonthData = useCallback(async (year: number, month: number): Promise<DayStreakData[]> => {
    const key = getMonthKey(year, month);
    if (monthCache.current.has(key)) {
      return monthCache.current.get(key)!;
    }
    const data = await getMonthStreakData(userId, year, month);
    monthCache.current.set(key, data);
    return data;
  }, [userId]);

  // Initial load - fetch all three months and wait until ready
  useEffect(() => {
    const fetchInitialData = async () => {
      const initPrev = getAdjacentMonth(initialYear, initialMonth, -1);
      const initNext = getAdjacentMonth(initialYear, initialMonth, 1);
      
      try {
        const [prevData, currData, nextData] = await Promise.all([
          fetchMonthData(initPrev.year, initPrev.month),
          fetchMonthData(initialYear, initialMonth),
          fetchMonthData(initNext.year, initNext.month),
        ]);
        setPrevMonthData(prevData);
        setCurrentMonthData(currData);
        setNextMonthData(nextData);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to fetch month data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Navigate to previous month - synchronously shift data first
  const navigateToPrevMonth = useCallback(() => {
    const newPrev = getAdjacentMonth(prev.year, prev.month, -1);
    
    // Synchronously shift data: current -> next, prev -> current
    // This must complete before we reset translateX
    setNextMonthData(currentMonthData);
    setCurrentMonthData(prevMonthData);
    setCurrentYear(prev.year);
    setCurrentMonth(prev.month);
    
    // Reset position immediately (data is already shifted)
    translateX.value = 0;
    
    // Fetch new previous month in background (from cache or network)
    fetchMonthData(newPrev.year, newPrev.month).then(newPrevData => {
      setPrevMonthData(newPrevData);
    });
  }, [prev, currentMonthData, prevMonthData, fetchMonthData, translateX]);

  // Navigate to next month - synchronously shift data first
  const navigateToNextMonth = useCallback(() => {
    const newNext = getAdjacentMonth(next.year, next.month, 1);
    
    // Synchronously shift data: current -> prev, next -> current
    setPrevMonthData(currentMonthData);
    setCurrentMonthData(nextMonthData);
    setCurrentYear(next.year);
    setCurrentMonth(next.month);
    
    // Reset position immediately (data is already shifted)
    translateX.value = 0;
    
    // Fetch new next month in background (from cache or network)
    fetchMonthData(newNext.year, newNext.month).then(newNextData => {
      setNextMonthData(newNextData);
    });
  }, [next, currentMonthData, nextMonthData, fetchMonthData, translateX]);

  const handleSwipeComplete = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      navigateToPrevMonth();
    } else {
      navigateToNextMonth();
    }
  }, [navigateToPrevMonth, navigateToNextMonth]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right -> go to previous month
        // Animate to final position, then swap content
        translateX.value = screenWidth;
        runOnJS(handleSwipeComplete)('prev');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left -> go to next month
        translateX.value = -screenWidth;
        runOnJS(handleSwipeComplete)('next');
      } else {
        // Snap back - just reset position
        translateX.value = 0;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Don't render until initial data is loaded
  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.monthTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.carouselWrapper}>
          <Animated.View style={[styles.carousel, animatedStyle]}>
            {/* Previous Month */}
            <View style={[styles.monthSlide, { width: screenWidth, marginLeft: -screenWidth }]}>
              <MonthGrid monthData={prevMonthData} year={prev.year} month={prev.month} />
            </View>

            {/* Current Month */}
            <View style={[styles.monthSlide, { width: screenWidth }]}>
              <MonthGrid monthData={currentMonthData} year={currentYear} month={currentMonth} />
            </View>

            {/* Next Month */}
            <View style={[styles.monthSlide, { width: screenWidth }]}>
              <MonthGrid monthData={nextMonthData} year={next.year} month={next.month} />
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
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
    overflow: 'hidden',
  },
  carouselWrapper: {
    overflow: 'hidden',
  },
  carousel: {
    flexDirection: 'row',
  },
  monthSlide: {
    flexShrink: 0,
  },
  monthContainer: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['4'],
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
});
