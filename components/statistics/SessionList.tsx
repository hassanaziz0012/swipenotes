import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/styles';
import { Session } from '../../db/models/session';
import { SessionItem } from './SessionItem';

interface SessionListProps {
  sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sessions yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Sessions</Text>
      {sessions.map((session) => (
        <SessionItem key={session.id} session={session} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing[4],
  },
  title: {
    ...Typography.lg,
    fontWeight: 'bold',
    marginBottom: Spacing[2],
    color: Colors.text.base,
  },
  emptyContainer: {
    padding: Spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.base,
    color: Colors.text.subtle,
  },
});
