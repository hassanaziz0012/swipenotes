import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';

interface ReviewQueueStatCardProps {
  count: number;
  style?: StyleProp<ViewStyle>;
}

export function ReviewQueueStatCard({ count, style }: ReviewQueueStatCardProps) {
  const router = useRouter();

  const handleReviewPress = () => {
    router.push('/(tabs)/study');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="albums" size={24} color={Colors.primary.base} />
        </View>
        <View style={styles.content}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.subtitle}>
            {count === 1 ? 'card' : 'cards'} waiting for review
            </Text>
        </View>
      </View>
      

        {count > 0 ? (
            <TouchableOpacity style={styles.button} onPress={handleReviewPress}>
                <Text style={styles.buttonText}>Review Now</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.background.base} />
            </TouchableOpacity>
        ) : (
            <View style={styles.emptyStateContainer}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary.base} />
                <Text style={styles.emptyStateText}>You're all caught up!</Text>
            </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
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
    gap: Spacing['3'],
    marginBottom: Spacing['3'],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary.light6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: Spacing['4'],
  },
  count: {
    fontFamily: FontFamily.bold,
    ...Typography['4xl'],
    color: Colors.text.base,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    ...Typography.sm,
    color: Colors.text.subtle,
  },
  button: {
    backgroundColor: Colors.primary.base,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: 12, // Consistent border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    gap: Spacing['2'],
  },
  buttonText: {
    fontFamily: FontFamily.bold,
    ...Typography.base,
    color: Colors.background.base,
  },
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    backgroundColor: Colors.primary.light6, // Subtle background for message
    padding: Spacing['3'],
    borderRadius: 8,
  },
  emptyStateText: {
    fontFamily: FontFamily.regular,
    ...Typography.sm,
    color: Colors.primary.dark1,
  },
});
