import { MAX_TAGS } from '@/utils/tagsCleanup';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { type Project } from '../db/models/project';

export interface CardEditFormRef {
  submit: () => Promise<void>;
  reset: () => void;
  isDirty: () => boolean;
}

interface CardEditFormProps {
  initialContent: string;
  initialProjectId: number | null;
  initialTags: string[];
  initialInReviewQueue: boolean;
  availableProjects: Project[];
  availableTags: string[];
  onSaveContent?: (newContent: string) => Promise<void>;
  onUpdateProject?: (projectId: number | null) => Promise<void>;
  onUpdateTags?: (tags: string[]) => Promise<void>;
  onUpdateReviewQueue?: (inReviewQueue: boolean) => Promise<void>;
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
}

export const CardEditForm = forwardRef<CardEditFormRef, CardEditFormProps>(
  (
    {
      initialContent,
      initialProjectId,
      initialTags,
      initialInReviewQueue,
      availableProjects,
      availableTags,
      onSaveContent,
      onUpdateProject,
      onUpdateTags,
      onUpdateReviewQueue,
      onSaveStart,
      onSaveEnd,
    },
    ref
  ) => {
    const [editedContent, setEditedContent] = useState(initialContent);
    const [editedProjectId, setEditedProjectId] = useState<number | null>(
      initialProjectId
    );
    const [editedTags, setEditedTags] = useState<string[]>(initialTags);
    const [editedInReviewQueue, setEditedInReviewQueue] =
      useState(initialInReviewQueue);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        onSaveStart?.();
        try {
          // Save content if changed
          if (
            onSaveContent &&
            editedContent !== initialContent
          ) {
            await onSaveContent(editedContent);
          }
          // Save project if changed
          if (
            onUpdateProject &&
            editedProjectId !== initialProjectId
          ) {
            await onUpdateProject(editedProjectId);
          }
          // Save tags if changed
          if (
            onUpdateTags &&
            JSON.stringify(editedTags) !== JSON.stringify(initialTags)
          ) {
            await onUpdateTags(editedTags);
          }
          // Save review queue status if changed
          if (
            onUpdateReviewQueue &&
            editedInReviewQueue !== initialInReviewQueue
          ) {
            await onUpdateReviewQueue(editedInReviewQueue);
          }
        } catch (error) {
          console.error('Failed to save content:', error);
          throw error;
        } finally {
          onSaveEnd?.();
        }
      },
      reset: () => {
        setEditedContent(initialContent);
        setEditedProjectId(initialProjectId);
        setEditedTags(initialTags);
        setEditedInReviewQueue(initialInReviewQueue);
        setShowProjectPicker(false);
        setShowAllTags(false);
      },
      isDirty: () => {
        return (
          editedContent !== initialContent ||
          editedProjectId !== initialProjectId ||
          JSON.stringify(editedTags) !== JSON.stringify(initialTags) ||
          editedInReviewQueue !== initialInReviewQueue
        );
      },
    }));

    const toggleEditedTag = (tag: string) => {
      setEditedTags((prev) => {
        if (prev.includes(tag)) {
          return prev.filter((t) => t !== tag);
        }
        // Enforce max 10 tags limit
        if (prev.length >= MAX_TAGS) {
          return prev;
        }
        return [...prev, tag];
      });
    };

    const getProjectName = (id: number | null) => {
      if (!id) return 'No Project';
      const project = availableProjects.find((p) => p.id === id);
      return project ? project.name : 'No Project';
    };

    return (
      <View style={styles.editOptionsContainer}>
        {/* Project Selector */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Project:</Text>
          <View style={styles.projectSelectorContainer}>
            <TouchableOpacity
              style={styles.projectSelector}
              onPress={() => setShowProjectPicker(!showProjectPicker)}
            >
              <Text
                style={[
                  styles.projectSelectorText,
                  !editedProjectId && { color: Colors.text.subtle },
                ]}
              >
                {getProjectName(editedProjectId)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={Colors.text.subtle}
              />
            </TouchableOpacity>

            {showProjectPicker && (
              <View style={styles.projectPickerDropdown}>
                <ScrollView
                  style={styles.projectPickerScroll}
                  nestedScrollEnabled
                >
                  <TouchableOpacity
                    style={styles.projectPickerItem}
                    onPress={() => {
                      setEditedProjectId(null);
                      setShowProjectPicker(false);
                    }}
                  >
                    <Text style={styles.projectPickerItemText}>No Project</Text>
                    {editedProjectId === null && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={Colors.primary.base}
                      />
                    )}
                  </TouchableOpacity>
                  {availableProjects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={styles.projectPickerItem}
                      onPress={() => {
                        setEditedProjectId(project.id);
                        setShowProjectPicker(false);
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: project.color,
                          }}
                        />
                        <Text style={styles.projectPickerItemText}>
                          {project.name}
                        </Text>
                      </View>
                      {editedProjectId === project.id && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Colors.primary.base}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Review Queue Toggle */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Review Queue:</Text>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <Switch
              value={editedInReviewQueue}
              onValueChange={setEditedInReviewQueue}
              trackColor={{
                false: Colors.border.subtle,
                true: Colors.primary.light6,
              }}
              thumbColor={
                editedInReviewQueue ? Colors.primary.base : '#f4f3f4'
              }
            />
            <Text
              style={{
                marginLeft: 8,
                color: Colors.text.subtle,
                fontSize: Typography.sm.fontSize,
              }}
            >
              {editedInReviewQueue
                ? 'In Review Queue'
                : 'Not in Review Queue'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.optionLabel, { marginBottom: 8 }]}>
          Content:
        </Text>
        <TextInput
          style={styles.textInput}
          value={editedContent}
          onChangeText={setEditedContent}
          multiline
          placeholder="Enter card content..."
          placeholderTextColor={Colors.text.subtle}
          textAlignVertical="top"
          blurOnSubmit={false}
        />

        <View style={styles.divider} />

        {/* Tags Editor - Moved to end */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Tags (max: {MAX_TAGS}):</Text>
          <View
            style={[
              styles.tagsContainer,
              !showAllTags && styles.tagsContainerCollapsed,
            ]}
          >
            {(() => {
              const tagsToShow = showAllTags ? availableTags : availableTags; // Logic preserved from original
              return tagsToShow.map((tag) => {
                const isSelected = editedTags.includes(tag);
                const isDisabled =
                  !isSelected && editedTags.length >= MAX_TAGS;
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                      isDisabled && styles.tagChipDisabled,
                    ]}
                    onPress={() => toggleEditedTag(tag)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                        isDisabled && styles.tagTextDisabled,
                      ]}
                    >
                      {tag.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
          {!showAllTags && availableTags.length > 15 && (
            <TouchableOpacity
              onPress={() => setShowAllTags(true)}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          )}
          {showAllTags && availableTags.length > 15 && (
            <TouchableOpacity
              onPress={() => setShowAllTags(false)}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText}>Show less</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  textInput: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
    backgroundColor: Colors.background.base,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing['4'],
    minHeight: 200,
    lineHeight: Typography.base.lineHeight,
  },
  editOptionsContainer: {
    marginBottom: Spacing['4'],
    gap: Spacing['4'],
  },
  optionRow: {
    gap: Spacing['2'],
  },
  optionLabel: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.subtle,
  },
  projectSelectorContainer: {
    position: 'relative',
    zIndex: 10,
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.base,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 8,
    padding: Spacing['3'],
  },
  projectSelectorText: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
  },
  projectPickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  projectPickerScroll: {
    maxHeight: 200,
  },
  projectPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  projectPickerItemText: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['2'],
  },
  tagChip: {
    backgroundColor: Colors.background.base,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipSelected: {
    backgroundColor: Colors.primary.light6,
    borderColor: Colors.primary.base,
  },
  tagText: {
    fontSize: Typography.xs.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
  },
  tagTextSelected: {
    color: Colors.primary.dark3,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing['3'],
  },
  tagsContainerCollapsed: {
    maxHeight: 100, // Approximately 3 rows of tags
    overflow: 'hidden',
  },
  tagChipDisabled: {
    opacity: 0.4,
  },
  tagTextDisabled: {
    color: Colors.text.subtle,
  },
  showMoreButton: {
    marginTop: Spacing['2'],
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.primary.base,
  },
});
