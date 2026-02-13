import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { getCardsInReviewQueueCount } from '../db/services/cards';
import { retrieve_eligible_cards } from '../utils/swipeSession';
import { Divider } from './Divider';

interface StatusItem {
  message: string;
  route: string;
  routeParams?: Record<string, string>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const TodayStatus = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [eligibleCount, setEligibleCount] = useState(0);
  const [reviewQueueCount, setReviewQueueCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const fetchCounts = async () => {
        try {
          const { cards: eligibleCards } = await retrieve_eligible_cards(user.id);
          setEligibleCount(eligibleCards.length);

          const reviewCount = await getCardsInReviewQueueCount(user.id);
          setReviewQueueCount(reviewCount);
        } catch (error) {
          console.error('Failed to fetch status counts:', error);
        }
      };

      fetchCounts();
    }, [user])
  );

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const greeting = `${getGreeting()}, ${firstName}`;

  const statusItems: StatusItem[] = [];

  if (eligibleCount > 0) {
    statusItems.push({
      message: `You have ${eligibleCount} card${eligibleCount !== 1 ? 's' : ''} ready for discovery`,
      route: '/(tabs)/study',
    });
  }

  if (reviewQueueCount > 0) {
    statusItems.push({
      message: `You have ${reviewQueueCount} card${reviewQueueCount !== 1 ? 's' : ''} in your review queue. Clear them now?`,
      route: '/review-queue',
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>

      {statusItems.length > 0 && (
        <>
          <Divider style={styles.divider} />

          <View style={styles.statusList}>
            {statusItems.map((item, index) => (
              <View key={index} style={styles.statusItem}>
                <Text style={styles.statusMessage}>{item.message}</Text>
                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={() =>
                    router.push(
                      item.routeParams
                        ? { pathname: item.route as any, params: item.routeParams }
                        : (item.route as any)
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={Colors.primary.base}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: Spacing['5'],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  greeting: {
    ...Typography['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  divider: {
    marginVertical: Spacing['4'],
  },
  statusList: {
    gap: Spacing['3'],
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  statusMessage: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    flex: 1,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.light6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
