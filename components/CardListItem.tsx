import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { type Project } from '../db/models/project';
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
  tags: string[];
  projectId: number | null;
  // Available options for editing
  availableProjects?: Project[];
  availableTags?: string[];
  // Selection mode props
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  // Edit/View modal props
  onSaveContent?: (newContent: string) => Promise<void>;
  onUpdateProject?: (projectId: number | null) => Promise<void>;
  onUpdateTags?: (tags: string[]) => Promise<void>;
  onUpdateReviewQueue?: (inReviewQueue: boolean) => Promise<void>;
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

function truncateToWords(text: string, maxWords: number): string {
  // Match words while preserving the original text structure (for markdown)
  const wordRegex = /\S+/g;
  let match;
  let wordCount = 0;
  let lastIndex = 0;
  
  while ((match = wordRegex.exec(text)) !== null) {
    wordCount++;
    if (wordCount === maxWords) {
      lastIndex = match.index + match[0].length;
      break;
    }
  }
  
  // If we have fewer words than maxWords, return the original text
  if (wordCount < maxWords) {
    return text;
  }
  
  // Check if there are more words after our cutoff
  if (wordRegex.exec(text) !== null) {
    return text.slice(0, lastIndex) + '...';
  }
  
  return text;
}

export function CardListItem({
  content,
  sourceNoteTitle,
  createdAt,
  lastSeen,
  timesSeen,
  inReviewQueue,
  extractionMethod,
  tags,
  projectId,
  availableProjects = [],
  availableTags = [],
  isSelected = false,
  isSelectionMode = false,
  onLongPress,
  onPress,
  onSaveContent,
  onUpdateProject,
  onUpdateTags,
  onUpdateReviewQueue,
}: CardListItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // Default to edit mode
  const [editedContent, setEditedContent] = useState(content);
  const [editedProjectId, setEditedProjectId] = useState<number | null>(projectId);
  const [editedTags, setEditedTags] = useState<string[]>(tags);
  const [editedInReviewQueue, setEditedInReviewQueue] = useState(inReviewQueue);
  const [isSaving, setIsSaving] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 0.95 : 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePress = () => {
    if (isSelectionMode && onPress) {
      onPress();
    } else if (!isSelectionMode) {
      // Open modal in edit mode by default
      setEditedContent(content);
      setEditedProjectId(projectId);
      setEditedTags(tags);
      setEditedInReviewQueue(inReviewQueue);
      setIsEditMode(true);
      setIsModalVisible(true);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setIsEditMode(true); // Reset to edit mode for next open
    setEditedContent(content); // Reset edited content
    setEditedProjectId(projectId);
    setEditedTags(tags);
    setEditedInReviewQueue(inReviewQueue);
    setShowProjectPicker(false);
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      // Save content if changed
      if (onSaveContent && editedContent !== content) {
        await onSaveContent(editedContent);
      }
      // Save project if changed
      if (onUpdateProject && editedProjectId !== projectId) {
        await onUpdateProject(editedProjectId);
      }
      // Save tags if changed
      if (onUpdateTags && JSON.stringify(editedTags) !== JSON.stringify(tags)) {
        await onUpdateTags(editedTags);
      }
      // Save review queue status if changed
      if (onUpdateReviewQueue && editedInReviewQueue !== inReviewQueue) {
        await onUpdateReviewQueue(editedInReviewQueue);
      }
      setIsEditMode(false); // Switch to view mode after saving
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
  };

  const toggleEditedTag = (tag: string) => {
    setEditedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getProjectName = (id: number | null) => {
    if (!id) return 'No Project';
    const project = availableProjects.find(p => p.id === id);
    return project ? project.name : 'No Project';
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={600}
      >
        <Animated.View 
          style={[
            styles.card, 
            isSelected && styles.cardSelected,
            { transform: [{ scale: isSelected ? 0.95 : scaleAnim }] }
          ]}
        >
          {/* Selection Checkmark */}
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary.base} />
            </View>
          )}

          {/* Content Section */}
          <View style={styles.contentSection}>
            <TextMarkdownDisplay>{truncateToWords(content, 50)}</TextMarkdownDisplay>
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
        </Animated.View>
      </Pressable>

      {/* Card Edit/View Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentWrapper}
          >
            <View style={styles.modalContent}>
              <ScrollView
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.modalInnerContent}
                bounces={false}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Pressable 
                    onPress={handleCloseModal} 
                    style={styles.modalHeaderButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={Colors.text.base} />
                  </Pressable>
                  <Text style={styles.modalTitle}>
                    {isEditMode ? 'Edit Card' : 'View Card'}
                  </Text>
                  <Pressable 
                    onPress={isEditMode ? handleSaveContent : handleSwitchToEditMode} 
                    style={styles.modalHeaderButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={isSaving}
                  >
                    {isEditMode ? (
                      isSaving ? (
                        <Ionicons name="hourglass-outline" size={24} color={Colors.text.subtle} />
                      ) : (
                        <Ionicons name="checkmark" size={24} color={Colors.primary.base} />
                      )
                    ) : (
                      <Ionicons name="pencil" size={24} color={Colors.primary.base} />
                    )}
                  </Pressable>
                </View>

                {/* Modal Body */}
                <View style={styles.modalBody}>
                  {isEditMode ? (
                    <View style={styles.editOptionsContainer}>
                      {/* Project Selector */}
                      <View style={styles.optionRow}>
                        <Text style={styles.optionLabel}>Project:</Text>
                        <View style={styles.projectSelectorContainer}>
                          <TouchableOpacity 
                            style={styles.projectSelector}
                            onPress={() => setShowProjectPicker(!showProjectPicker)}
                          >
                            <Text style={[
                              styles.projectSelectorText, 
                              !editedProjectId && { color: Colors.text.subtle }
                            ]}>
                              {getProjectName(editedProjectId)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.text.subtle} />
                          </TouchableOpacity>
                          
                          {showProjectPicker && (
                            <View style={styles.projectPickerDropdown}>
                              <ScrollView style={styles.projectPickerScroll} nestedScrollEnabled>
                                <TouchableOpacity 
                                  style={styles.projectPickerItem}
                                  onPress={() => {
                                    setEditedProjectId(null);
                                    setShowProjectPicker(false);
                                  }}
                                >
                                  <Text style={styles.projectPickerItemText}>No Project</Text>
                                  {editedProjectId === null && <Ionicons name="checkmark" size={16} color={Colors.primary.base} />}
                                </TouchableOpacity>
                                {availableProjects.map(project => (
                                  <TouchableOpacity 
                                    key={project.id}
                                    style={styles.projectPickerItem}
                                    onPress={() => {
                                      setEditedProjectId(project.id);
                                      setShowProjectPicker(false);
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: project.color }} />
                                      <Text style={styles.projectPickerItemText}>{project.name}</Text>
                                    </View>
                                    {editedProjectId === project.id && <Ionicons name="checkmark" size={16} color={Colors.primary.base} />}
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Tags Editor */}
                      <View style={styles.optionRow}>
                        <Text style={styles.optionLabel}>Tags:</Text>
                        <View style={styles.tagsContainer}>
                          {availableTags.map(tag => {
                            const isSelected = editedTags.includes(tag);
                            return (
                              <TouchableOpacity
                                key={tag}
                                style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                                onPress={() => toggleEditedTag(tag)}
                              >
                                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                  {tag.replace(/([a-z])([A-Z])/g, '$1 $2')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Review Queue Toggle */}
                      <View style={styles.optionRow}>
                        <Text style={styles.optionLabel}>Review Queue:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Switch
                            value={editedInReviewQueue}
                            onValueChange={setEditedInReviewQueue}
                            trackColor={{ false: Colors.border.subtle, true: Colors.primary.light6 }}
                            thumbColor={editedInReviewQueue ? Colors.primary.base : '#f4f3f4'}
                          />
                          <Text style={{ marginLeft: 8, color: Colors.text.subtle, fontSize: Typography.sm.fontSize }}>
                            {editedInReviewQueue ? 'In Review Queue' : 'Not in Review Queue'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />
                      
                      <Text style={[styles.optionLabel, { marginBottom: 8 }]}>Content:</Text>
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
                    </View>
                  ) : (
                    <Pressable onPress={handleSwitchToEditMode}>
                      <TextMarkdownDisplay>{editedContent}</TextMarkdownDisplay>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
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
    position: 'relative',
  },
  cardSelected: {
    borderColor: Colors.primary.base,
    borderWidth: 2,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: Spacing['2'],
    left: Spacing['2'],
    zIndex: 10,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  modalHeaderButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  modalInnerContent: {
    flexGrow: 1,
  },
  modalBody: {
    flex: 1,
    padding: Spacing['4'],
    paddingBottom: Spacing['12'],
  },
  modalBodyContent: {
    padding: Spacing['4'],
    paddingBottom: Spacing['12'],
  },
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
    shadowColor: "#000",
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
});
