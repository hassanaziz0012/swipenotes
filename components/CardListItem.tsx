import { formatDate, formatRelativeDate, getNextReviewDate } from '@/utils/dates';
import { ExtractionMethod } from '@/utils/extraction';
import { truncateToWords } from '@/utils/text';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../constants/styles';
import { type Project } from '../db/models/project';
import { CardEditForm, CardEditFormRef } from './CardEditForm';
import { ContentModal } from './ContentModal';
import { ExtractionMethodPill } from './ExtractionMethodPill';
import { Pill } from './Pill';
import { TextMarkdownDisplay } from './TextMarkdownDisplay';

interface CardListItemProps {
  content: string;
  sourceNoteTitle: string;
  createdAt: Date;
  lastSeen: Date | null;
  timesSeen: number;
  intervalDays: number;
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



export function CardListItem({
  content,
  sourceNoteTitle,
  createdAt,
  lastSeen,
  timesSeen,
  intervalDays,
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
  const [isSaving, setIsSaving] = useState(false);
  
  const formRef = useRef<CardEditFormRef>(null);

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
      setIsEditMode(true);
      setIsModalVisible(true);
      // Reset form on open
      if (formRef.current) {
        formRef.current.reset();
      }
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
    formRef.current?.reset();
  };

  const handleSaveContent = async () => {
    if (formRef.current) {
      await formRef.current.submit();
      setIsEditMode(false); // Switch to view mode after saving
    }
  };

  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
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

          {/* Pills Row */}
          <View style={styles.pillsContainer}>
            {/* Project Pill */}
            {(() => {
              const project = availableProjects.find(p => p.id === projectId);
              if (project) {
                return (
                  <Pill
                    text={project.name}
                    icon={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: project.color }} />}
                  />
                );
              }
              return null;
            })()}
            {/* Source Pill */}
            <Pill
              text={sourceNoteTitle}
              icon={<Ionicons name="document-text-outline" size={14} color={Colors.text.subtle} />}
            />
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <TextMarkdownDisplay>{truncateToWords(content, 50)}</TextMarkdownDisplay>
          </View>

          {/* Metadata Pills Row */}
          <View style={styles.metadataPillsRow}>
            <ExtractionMethodPill method={extractionMethod} />
            <Pill
              text={(() => {
                const nextReview = getNextReviewDate(lastSeen, intervalDays);
                if (!nextReview) return 'Not scheduled';
                return `${formatDate(nextReview)} (${formatRelativeDate(nextReview)})`;
              })()}
              icon={<Ionicons name="time-outline" size={14} color={Colors.text.subtle} />}
            />
            <Pill
              text={lastSeen ? formatDate(lastSeen) : 'Never'}
              icon={<Ionicons name="eye-outline" size={14} color={Colors.text.subtle} />}
            />
            <Pill
              text={`${timesSeen}x seen`}
              icon={<Ionicons name="repeat-outline" size={14} color={Colors.text.subtle} />}
            />
            <Pill
              text={inReviewQueue ? 'In queue' : 'Not in queue'}
              icon={
                <Ionicons
                  name={inReviewQueue ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={inReviewQueue ? "hsl(140, 60%, 35%)" : "hsl(0, 60%, 45%)"} // Updated to match previous text color for icon consistency
                />
              }
              backgroundColor={inReviewQueue ? 'hsl(140, 50%, 92%)' : 'hsl(0, 50%, 94%)'}
              textColor={inReviewQueue ? 'hsl(140, 60%, 35%)' : 'hsl(0, 60%, 45%)'}
            />
          </View>

          {/* Divider before Tags */}
          {tags.length > 0 && <View style={styles.cardTagsDivider} />}

          {/* Tags Row */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag, index) => (
                <Pill
                  key={index}
                  text={tag.replace(/([a-z])([A-Z])/g, '$1 $2')}
                  backgroundColor={Colors.primary.light6}
                  textColor={Colors.primary.dark3}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Card Edit/View Modal */}
      <ContentModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        title={isEditMode ? 'Edit Card' : 'View Card'}
        headerRight={
          <Pressable 
            onPress={isEditMode ? handleSaveContent : handleSwitchToEditMode} 
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
        }
      >
        {isEditMode ? (
          <CardEditForm
            ref={formRef}
            initialContent={content}
            initialProjectId={projectId}
            initialTags={tags}
            initialInReviewQueue={inReviewQueue}
            availableProjects={availableProjects}
            availableTags={availableTags}
            onSaveContent={async (newContent) => {
                if (onSaveContent) {
                    await onSaveContent(newContent);
                    setEditedContent(newContent); // Update local display state
                }
            }}
            onUpdateProject={onUpdateProject}
            onUpdateTags={onUpdateTags}
            onUpdateReviewQueue={onUpdateReviewQueue}
            onSaveStart={() => setIsSaving(true)}
            onSaveEnd={() => setIsSaving(false)}
          />
        ) : (
          <Pressable onPress={handleSwitchToEditMode}>
            <TextMarkdownDisplay>{editedContent}</TextMarkdownDisplay>
          </Pressable>
        )}
      </ContentModal>
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing['4'],
    paddingTop: Spacing['3'],
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
  metadataPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing['4'],
    paddingBottom: Spacing['2'],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing['4'],
    paddingBottom: Spacing['3'],
  },
  cardTagsDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: Spacing['4'],
    marginTop: Spacing['2'],
    marginBottom: Spacing['1'],
  },
});

