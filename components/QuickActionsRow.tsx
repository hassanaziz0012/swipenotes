import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { navigateToAIExtraction, navigateToManualExtraction } from '../utils/documentImport';

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
}

export const QuickActionsRow = () => {
  const router = useRouter();
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [isExtractingManual, setIsExtractingManual] = useState(false);

  const handleAIImport = async () => {
    setIsExtractingAI(true);
    try {
      await navigateToAIExtraction(router);
    } finally {
      setIsExtractingAI(false);
    }
  };

  const handleManualImport = async () => {
    setIsExtractingManual(true);
    try {
      await navigateToManualExtraction(router);
    } finally {
      setIsExtractingManual(false);
    }
  };

  const actions: QuickAction[] = [
    {
      label: 'AI Import',
      icon: 'sparkles',
      onPress: handleAIImport,
      loading: isExtractingAI,
    },
    {
      label: 'Manual',
      icon: 'document-text',
      onPress: handleManualImport,
      loading: isExtractingManual,
    },
    {
      label: 'Review',
      icon: 'checkmark-circle',
      onPress: () => router.push('/review-queue'),
    },
    {
      label: 'Stats',
      icon: 'stats-chart',
      onPress: () => router.push('/(tabs)/statistics'),
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.actionButton}
          onPress={action.onPress}
          activeOpacity={0.7}
          disabled={action.loading}
        >
          <View style={[styles.iconCircle, action.loading && styles.iconCircleDisabled]}>
            {action.loading ? (
              <ActivityIndicator size="small" color={Colors.primary.base} />
            ) : (
              <Ionicons name={action.icon} size={22} color={Colors.primary.base} />
            )}
          </View>
          <Text style={styles.label} numberOfLines={1}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing['3'],
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing['1.5'],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary.light6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDisabled: {
    opacity: 0.7,
  },
  label: {
    ...Typography.xs,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    textAlign: 'center',
  },
});
