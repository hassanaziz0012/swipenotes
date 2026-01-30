import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontFamily, Spacing, Typography } from '../constants/styles';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

interface ExtractionMethodPillProps {
  method: ExtractionMethod;
}

const methodStyles: Record<ExtractionMethod, { backgroundColor: string; label: string }> = {
  chunk_paragraph: { backgroundColor: 'hsl(210, 70%, 55%)', label: 'Paragraph' },
  chunk_header: { backgroundColor: 'hsl(140, 60%, 45%)', label: 'Header' },
  ai: { backgroundColor: 'hsl(270, 60%, 55%)', label: 'AI' },
  full: { backgroundColor: 'hsl(30, 70%, 55%)', label: 'Full' },
};

export function ExtractionMethodPill({ method }: ExtractionMethodPillProps) {
  const { backgroundColor, label } = methodStyles[method] || methodStyles.full;

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing['2.5'],
    paddingVertical: Spacing['1'],
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: Typography.xs.fontSize,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
  },
});
