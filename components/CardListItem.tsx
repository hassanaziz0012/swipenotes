import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { ExtractionMethodPill } from './ExtractionMethodPill';
import { TextMarkdownDisplay } from './TextMarkdownDisplay';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

interface CardListItemProps {
  content: string;
  sourceNoteTitle: string;
  createdAt: Date;
  lastSeen: Date | null;
  timesSeen: number;
  inReviewQueue: boolean;
  extractionMethod: ExtractionMethod;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CardListItem({
  content,
  sourceNoteTitle,
  createdAt,
  lastSeen,
  timesSeen,
  inReviewQueue,
  extractionMethod,
}: CardListItemProps) {
  return (
    <View style={styles.card}>
      {/* Content Section */}
      <View style={styles.contentSection}>
        <TextMarkdownDisplay>{content}</TextMarkdownDisplay>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        {/* Source Note */}
        <View style={styles.metaRow}>
          <Ionicons name="document-text-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>Source:</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{sourceNoteTitle}</Text>
        </View>

        {/* Created At */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>Created:</Text>
          <Text style={styles.metaValue}>{formatDate(createdAt)}</Text>
        </View>

        {/* Last Seen */}
        <View style={styles.metaRow}>
          <Ionicons name="eye-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>Last seen:</Text>
          <Text style={styles.metaValue}>{lastSeen ? formatDate(lastSeen) : 'Never'}</Text>
        </View>

        {/* Times Seen */}
        <View style={styles.metaRow}>
          <Ionicons name="repeat-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>Times seen:</Text>
          <Text style={styles.metaValue}>{timesSeen}</Text>
        </View>

        {/* In Review Queue */}
        <View style={styles.metaRow}>
          <Ionicons name="layers-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>In review:</Text>
          {inReviewQueue ? (
            <Ionicons name="checkmark-circle" size={18} color="hsl(140, 60%, 45%)" />
          ) : (
            <Ionicons name="close-circle" size={18} color="hsl(0, 60%, 55%)" />
          )}
        </View>

        {/* Extraction Method */}
        <View style={styles.metaRow}>
          <Ionicons name="construct-outline" size={16} color={Colors.text.subtle} />
          <Text style={styles.metaLabel}>Method:</Text>
          <ExtractionMethodPill method={extractionMethod} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    marginBottom: Spacing['4'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  contentSection: {
    padding: Spacing['4'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: Spacing['4'],
  },
  metadataSection: {
    padding: Spacing['4'],
    gap: Spacing['2'],
    backgroundColor: Colors.background.base,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
  },
  metaLabel: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    minWidth: 75,
  },
  metaValue: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
    flex: 1,
  },
});
