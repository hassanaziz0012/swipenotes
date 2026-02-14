import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';

export interface FilterItemProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FilterItem({ label, selected, onPress, icon, rightIcon, style }: FilterItemProps) {
  return (
    <TouchableOpacity
      style={[styles.modalItem, selected ? styles.modalItemSelected : {}, style]}
      onPress={onPress}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.modalItemText,
          selected ? styles.modalItemTextSelected : {},
          { flex: 1 },
        ]}
      >
        {label}
      </Text>
      {rightIcon ? (
        rightIcon
      ) : (
        selected && <Ionicons name="checkmark" size={20} color={Colors.primary.base} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  modalItemSelected: {
    backgroundColor: Colors.background.base,
    paddingHorizontal: Spacing['2'],
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  modalItemText: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
  },
  modalItemTextSelected: {
    color: Colors.primary.base,
    fontFamily: FontFamily.bold,
  },
  iconContainer: {
    marginRight: Spacing['2'],
  },
});
