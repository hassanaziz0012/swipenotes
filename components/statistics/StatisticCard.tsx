import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';

interface StatisticCardProps {
  title: string;
  count: number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  countStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export function StatisticCard({ 
  title, 
  count, 
  iconName, 
  iconColor = Colors.primary.base,
  countStyle,
  style 
}: StatisticCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{title}</Text>
          <Text style={[styles.count, countStyle]}>{count}</Text>
        </View>
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['4'],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary.light6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: Colors.text.subtle,
    marginBottom: 4,
  },
  count: {
    fontFamily: FontFamily.bold,
    fontSize: Typography['2xl'].fontSize,
    color: Colors.text.base,
    lineHeight: Typography['2xl'].lineHeight,
  },
});
