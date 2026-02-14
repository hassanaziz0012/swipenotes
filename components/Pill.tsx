import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, Typography } from '../constants/styles';

interface PillProps {
  text: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

export function Pill({
  text,
  icon,
  backgroundColor = Colors.background.base,
  textColor = Colors.text.subtle,
  borderColor,
  style,
}: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor },
        borderColor && { borderWidth: 1, borderColor },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.xs,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
});
