import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/styles';
import { FilterItem } from './FilterItem';
import { FilterModal } from './FilterModal';

interface TagsFilterProps {
  visible: boolean;
  onClose: () => void;
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export function TagsFilter({
  visible,
  onClose,
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: TagsFilterProps) {
  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      title="Select Tags"
      headerRight={
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      }
      data={availableTags}
      keyExtractor={(item) => item}
      renderItem={({ item }) => {
        const isSelected = selectedTags.includes(item);
        return (
          <FilterItem
            label={item}
            selected={isSelected}
            onPress={() => onToggleTag(item)}
            rightIcon={
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            }
          />
        );
      }}
      ListFooterComponent={
        availableTags.length > 0 ? (
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClearTags}>
            <Text style={styles.modalCloseButtonText}>Clear Tags</Text>
          </TouchableOpacity>
        ) : null
      }
      scrollable={false}
    />
  );
}

const styles = StyleSheet.create({
  doneButtonText: {
    color: Colors.primary.base,
    fontFamily: FontFamily.bold,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: Colors.primary.base,
    backgroundColor: Colors.primary.base,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary.dark3,
  },
});
