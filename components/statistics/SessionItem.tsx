import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/styles';
import { Session } from '../../db/models/session';

interface SessionItemProps {
  session: Session;
}

export function SessionItem({ session }: SessionItemProps) {
  const getDuration = () => {
    if (!session.endedAt) return 'Active';
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const containerStyle = [
    styles.container,
    session.isActive && styles.activeContainer,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date(session.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
        <Text style={styles.duration}>{getDuration()}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.cardsSwiped}>
          {session.cardsSwiped} cards swiped
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing[4],
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    marginBottom: Spacing[3],
  },
  activeContainer: {
    backgroundColor: Colors.primary.light6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  date: {
    ...Typography.base,
    fontWeight: '600',
    color: Colors.text.base,
  },
  duration: {
    ...Typography.sm,
    color: Colors.text.subtle,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardsSwiped: {
    ...Typography.sm,
    color: Colors.text.subtle,
  },
});
