import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

export interface ProjectCardCount {
  project: {
    id: number;
    name: string;
    color: string;
  };
  count: number;
}

interface CardCountsByProjectProps {
  projectCounts: ProjectCardCount[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardCountsByProject({ 
  projectCounts, 
  title = "Cards by Project",
  style 
}: CardCountsByProjectProps) {
  if (projectCounts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.projectList}>
        {projectCounts.map((item) => (
          <View key={item.project.id} style={styles.projectRow}>
            <View style={styles.projectInfo}>
              <View style={[styles.projectDot, { backgroundColor: item.project.color }]} />
              <Text style={styles.projectName} numberOfLines={1}>{item.project.name}</Text>
            </View>
            <View style={[styles.countCircle, { borderColor: item.project.color }]}>
              <Text style={[styles.countText, { color: item.project.color }]}>{item.count}</Text>
            </View>
          </View>
        ))}
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
  title: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.xs.fontSize,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
    color: Colors.text.base,
    marginBottom: Spacing['3'],
  },
  projectList: {
    gap: Spacing['3'],
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing['3'],
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing['2'],
  },
  projectName: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: Colors.text.base,
    flex: 1,
  },
  countCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
  },
  countText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.sm.fontSize,
  },
});
