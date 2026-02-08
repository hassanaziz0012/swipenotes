import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';

interface StreakDisplayProps {
  streakCount: number;
  userName?: string;
}

export function StreakDisplay({ streakCount, userName }: StreakDisplayProps) {
  const streakLabel = streakCount === 1 ? 'Day Streak' : 'Week Streak';
  const motivationalText = userName 
    ? `You are doing really great, ${userName}!`
    : 'You are doing really great!';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="flame" size={48} color={Colors.primary.base} />
      </View>
      
      <Text style={styles.streakCount}>{streakCount}</Text>
      <Text style={styles.streakLabel}>{streakLabel}</Text>
      <Text style={styles.motivationalText}>{motivationalText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: Spacing['6'],
    alignItems: 'center',
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.light6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2'],
  },
  streakCount: {
    fontFamily: FontFamily.bold,
    fontSize: Typography['5xl'].fontSize,
    lineHeight: Typography['5xl'].lineHeight,
    color: Colors.text.base,
  },
  streakLabel: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.lg.fontSize,
    color: Colors.text.base,
    marginTop: Spacing['1'],
  },
  motivationalText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: Colors.text.subtle,
    marginTop: Spacing['1'],
  },
});
