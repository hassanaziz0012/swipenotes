import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { db } from '../db/client';
import { projects, type Project } from '../db/models/project';
import { sourceNotes } from '../db/models/sourcenote';
import { tags as tagsTable } from '../db/models/tag';
import { setCardInReviewQueue, toggleCardsReviewQueue, updateCardContent, updateCardProject, updateCardTags } from '../db/services';
import { CardListItem } from './CardListItem';

type ExtractionMethod = 'chunk_paragraph' | 'chunk_header' | 'ai' | 'full';

export interface CardWithSourceNote {
  id: number;
  content: string;
  createdAt: Date;
  lastSeen: Date | null;
  timesSeen: number;
  inReviewQueue: boolean;
  extractionMethod: ExtractionMethod;
  sourceNoteTitle: string;
  tags: string[];
  projectId: number | null;
}

interface FilterState {
  sourceNoteId: number | null;
  extractionMethod: ExtractionMethod | null;
  tags: string[];
}

interface CardListProps {
  cardList: CardWithSourceNote[];
  loading: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  onDeleteCards?: (cardIds: number[]) => Promise<void>;
  onCardUpdated?: () => void;
}

const EXTRACTION_METHODS: { label: string; value: ExtractionMethod }[] = [
  { label: 'Paragraph Chunk', value: 'chunk_paragraph' },
  { label: 'Header Chunk', value: 'chunk_header' },
  { label: 'AI Extraction', value: 'ai' },
  { label: 'Full Text', value: 'full' },
];

export function CardList({ 
  cardList: allCards, 
  loading, 
  showFilters = true,
  emptyMessage = 'No cards found',
  emptySubtext = 'Try adjusting your filters',
  onDeleteCards,
  onCardUpdated,
}: CardListProps) {
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    sourceNoteId: null,
    extractionMethod: null,
    tags: [],
  });

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(new Set());

  // Available Options
  const [availableSourceNotes, setAvailableSourceNotes] = useState<{ id: number; title: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  // Modal Visibility
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // Filtered cards
  const [filteredCards, setFilteredCards] = useState<CardWithSourceNote[]>(allCards);

  const fetchOptions = useCallback(async () => {
    try {
      // Fetch Source Notes
      const notes = await db.select({ id: sourceNotes.id, title: sourceNotes.originalFileName }).from(sourceNotes);
      setAvailableSourceNotes(notes);

      // Fetch Tags (Get all cards and extract unique tags)
      // Fetch Tags
      const allTags = await db.select({ name: tagsTable.name }).from(tagsTable);
      setAvailableTags(allTags.map(t => t.name).sort());

      // Fetch Projects
      const allProjects = await db.select().from(projects);
      setAvailableProjects(allProjects);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    if (showFilters) {
      fetchOptions();
    }
  }, [fetchOptions, showFilters]);

  // Apply filters when cards or filters change
  useEffect(() => {
    let result = allCards;

    if (showFilters) {
      // Filter by source note (need to match by title since we don't have sourceNoteId in props)
      if (filters.sourceNoteId !== null) {
        const noteTitle = availableSourceNotes.find(n => n.id === filters.sourceNoteId)?.title;
        if (noteTitle) {
          result = result.filter(card => card.sourceNoteTitle === noteTitle);
        }
      }

      // Filter by extraction method
      if (filters.extractionMethod !== null) {
        result = result.filter(card => card.extractionMethod === filters.extractionMethod);
      }

      // Filter by tags
      if (filters.tags.length > 0) {
        result = result.filter(card => 
          card.tags && card.tags.some(tag => filters.tags.includes(tag))
        );
      }
    }

    setFilteredCards(result);
  }, [allCards, filters, showFilters, availableSourceNotes]);

  const clearFilters = () => {
    setFilters({
      sourceNoteId: null,
      extractionMethod: null,
      tags: [],
    });
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  // Selection Mode Functions
  const toggleCardSelection = (cardId: number) => {
    setSelectedCardIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
        // Exit selection mode if no cards are selected
        if (newSet.size === 0) {
          setIsSelectionMode(false);
        }
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleLongPress = (cardId: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    toggleCardSelection(cardId);
  };

  const selectAllCards = () => {
    const allFilteredIds = new Set(filteredCards.map((card) => card.id));
    setSelectedCardIds(allFilteredIds);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedCardIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedCardIds.size === 0) return;
    
    Alert.alert(
      'Delete Cards',
      `Are you sure you want to delete ${selectedCardIds.size} card${selectedCardIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteCards) {
              await onDeleteCards(Array.from(selectedCardIds));
              exitSelectionMode();
            }
          },
        },
      ]
    );
  };

  const handleToggleReviewQueue = async () => {
    if (selectedCardIds.size === 0) return;
    
    try {
      await toggleCardsReviewQueue(Array.from(selectedCardIds));
      exitSelectionMode();
      if (onCardUpdated) {
        onCardUpdated();
      }
    } catch (error) {
      console.error('Failed to toggle review queue:', error);
      Alert.alert('Error', 'Failed to update review queue status');
    }
  };

  const handleSaveCardContent = async (cardId: number, newContent: string) => {
    await updateCardContent(cardId, newContent);
    // Notify parent to refresh the card list
    if (onCardUpdated) {
      onCardUpdated();
    }
  };

  const handleUpdateCardProject = async (cardId: number, projectId: number | null) => {
    await updateCardProject(cardId, projectId);
    if (onCardUpdated) onCardUpdated();
  };

  const handleUpdateCardTags = async (cardId: number, tags: string[]) => {
    await updateCardTags(cardId, tags);
    if (onCardUpdated) onCardUpdated();
  };

  const handleUpdateCardReviewQueue = async (cardId: number, inReviewQueue: boolean) => {
    await setCardInReviewQueue(cardId, inReviewQueue);
    if (onCardUpdated) onCardUpdated();
  };

  const getSourceNoteTitle = (id: number | null) => {
    if (!id) return 'Source Note';
    const note = availableSourceNotes.find((n) => n.id === id);
    return note ? note.title : 'Source Note';
  };

  const getMethodLabel = (method: ExtractionMethod | null) => {
    if (!method) return 'Extraction';
    const opt = EXTRACTION_METHODS.find((m) => m.value === method);
    return opt ? opt.label : 'Extraction';
  };

  const renderFilterButton = (
    label: string, 
    icon: keyof typeof Ionicons.glyphMap, 
    isActive: boolean, 
    onPress: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.filterButton, isActive && styles.filterButtonActive]} 
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={isActive ? Colors.primary.light6 : Colors.text.base} 
      />
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons 
        name="chevron-down" 
        size={12} 
        color={isActive ? Colors.primary.light6 : Colors.text.subtle} 
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );

  const hasActiveFilters = filters.sourceNoteId !== null || filters.extractionMethod !== null || filters.tags.length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={exitSelectionMode} style={styles.selectionHeaderButton}>
            <Ionicons name="close" size={24} color={Colors.text.base} />
          </TouchableOpacity>
          <Text style={styles.selectionHeaderText}>
            {selectedCardIds.size} selected
          </Text>
          <View style={styles.selectionHeaderActions}>
            <TouchableOpacity onPress={selectAllCards} style={styles.selectionHeaderButton}>
              <Ionicons name="checkbox-outline" size={24} color={Colors.text.base} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleReviewQueue} style={styles.selectionHeaderButton}>
              <Ionicons name="repeat-outline" size={24} color={Colors.primary.base} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSelected} style={styles.selectionHeaderButton}>
              <Ionicons name="trash-outline" size={24} color="hsl(0, 60%, 55%)" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filters Section */}
      {showFilters && !isSelectionMode && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {renderFilterButton(
              getSourceNoteTitle(filters.sourceNoteId),
              'document-text-outline',
              filters.sourceNoteId !== null,
              () => setShowSourceModal(true)
            )}
            {renderFilterButton(
              getMethodLabel(filters.extractionMethod),
              'options-outline',
              filters.extractionMethod !== null,
              () => setShowMethodModal(true)
            )}
            {renderFilterButton(
              filters.tags.length > 0 ? `${filters.tags.length} Tag${filters.tags.length > 1 ? 's' : ''}` : 'Tags',
              'pricetag-outline',
              filters.tags.length > 0,
              () => setShowTagsModal(true)
            )}
          </ScrollView>
          
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
               <Ionicons name="refresh-outline" size={14} color={Colors.text.subtle} />
               <Text style={styles.clearButtonText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <Text style={styles.loadingText}>Loading cards...</Text>
        ) : filteredCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color={Colors.text.subtle} />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
            <Text style={styles.emptySubtext}>{emptySubtext}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardCount}>{filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}</Text>
            {filteredCards.map((card) => (
              <CardListItem
                key={card.id}
                content={card.content}
                sourceNoteTitle={card.sourceNoteTitle}
                createdAt={card.createdAt}
                lastSeen={card.lastSeen}
                timesSeen={card.timesSeen}
                inReviewQueue={card.inReviewQueue}
                extractionMethod={card.extractionMethod}
                isSelected={selectedCardIds.has(card.id)}
                isSelectionMode={isSelectionMode}
                onLongPress={() => handleLongPress(card.id)}
                onPress={() => toggleCardSelection(card.id)}
                onSaveContent={(newContent) => handleSaveCardContent(card.id, newContent)}
                projectId={card.projectId}
                tags={card.tags}
                availableProjects={availableProjects}
                availableTags={availableTags}
                onUpdateProject={(projectId) => handleUpdateCardProject(card.id, projectId)}
                onUpdateTags={(tags) => handleUpdateCardTags(card.id, tags)}
                onUpdateReviewQueue={(inReviewQueue) => handleUpdateCardReviewQueue(card.id, inReviewQueue)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Source Note Modal */}
      <Modal visible={showSourceModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSourceModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Source Note</Text>
            <FlatList
              data={[{ id: -1, title: 'All Source Notes' }, ...availableSourceNotes]} 
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem, 
                    (item.id === -1 && filters.sourceNoteId === null) || item.id === filters.sourceNoteId ? styles.modalItemSelected : {}
                  ]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, sourceNoteId: item.id === -1 ? null : item.id }));
                    setShowSourceModal(false);
                  }}
                >
                  <Text style={[
                      styles.modalItemText,
                      (item.id === -1 && filters.sourceNoteId === null) || item.id === filters.sourceNoteId ? styles.modalItemTextSelected : {}
                  ]}>
                    {item.title}
                  </Text>
                  {((item.id === -1 && filters.sourceNoteId === null) || item.id === filters.sourceNoteId) && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary.base} />
                  )}
                </TouchableOpacity>
              )}
            />
             <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSourceModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Extraction Method Modal */}
      <Modal visible={showMethodModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMethodModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Extraction Method</Text>
            <TouchableOpacity 
                  style={[styles.modalItem, filters.extractionMethod === null ? styles.modalItemSelected : {}]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, extractionMethod: null }));
                    setShowMethodModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, filters.extractionMethod === null ? styles.modalItemTextSelected : {}]}>All Methods</Text>
                   {filters.extractionMethod === null && <Ionicons name="checkmark" size={20} color={Colors.primary.base} />}
            </TouchableOpacity>
            {EXTRACTION_METHODS.map((method) => (
               <TouchableOpacity 
               key={method.value}
               style={[styles.modalItem, filters.extractionMethod === method.value ? styles.modalItemSelected : {}]}
               onPress={() => {
                 setFilters(prev => ({ ...prev, extractionMethod: method.value }));
                 setShowMethodModal(false);
               }}
             >
               <Text style={[styles.modalItemText, filters.extractionMethod === method.value ? styles.modalItemTextSelected : {}]}>{method.label}</Text>
               {filters.extractionMethod === method.value && <Ionicons name="checkmark" size={20} color={Colors.primary.base} />}
             </TouchableOpacity>
            ))}
             <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMethodModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

       {/* Tags Modal */}
       <Modal visible={showTagsModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTagsModal(false)}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['4'] }}>
              <Text style={styles.modalTitle}>Select Tags</Text>
              <TouchableOpacity onPress={() => setShowTagsModal(false)}>
                <Text style={{ color: Colors.primary.base, fontFamily: FontFamily.bold }}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {availableTags.length === 0 ? (
               <Text style={{ padding: Spacing['4'], color: Colors.text.subtle, textAlign: 'center' }}>No tags available</Text>
            ) : (
              <FlatList
                data={availableTags}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = filters.tags.includes(item);
                  return (
                    <TouchableOpacity 
                      style={[styles.modalItem, isSelected ? styles.modalItemSelected : {}]}
                      onPress={() => toggleTag(item)}
                    >
                      <Text style={[styles.modalItemText, isSelected ? styles.modalItemTextSelected : {}]}>{item}</Text>
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: isSelected ? Colors.primary.base : Colors.border.subtle, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? Colors.primary.base : 'transparent' }}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
             )}
             
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
               setFilters(prev => ({ ...prev, tags: [] }));
            }}>
              <Text style={[styles.modalCloseButtonText, { color: Colors.primary.dark3 }]}>Clear Tags</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  selectionHeaderText: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  selectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
  },
  selectionHeaderButton: {
    padding: Spacing['2'],
  },
  filtersContainer: {
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  filtersScroll: {
    paddingHorizontal: Spacing['4'],
    gap: Spacing['2'],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['3'],
    backgroundColor: Colors.background.base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    maxWidth: 200,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.base,
    borderColor: Colors.primary.base,
  },
  filterButtonText: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
    marginLeft: Spacing['2'],
  },
  filterButtonTextActive: {
    color: Colors.primary.light6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['3'],
    paddingVertical: Spacing['1'],
  },
  clearButtonText: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    marginLeft: Spacing['1'],
  },
  container: {
    padding: Spacing['4'],
    paddingBottom: Spacing['8'],
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.text.subtle,
    marginTop: Spacing['8'],
    fontFamily: FontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing['16'],
  },
  emptyText: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    marginTop: Spacing['4'],
  },
  emptySubtext: {
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    marginTop: Spacing['2'],
  },
  cardCount: {
    fontSize: Typography.sm.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    marginBottom: Spacing['4'],
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing['4'],
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    marginBottom: Spacing['4'],
    textAlign: 'center',
  },
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
  modalCloseButton: {
    marginTop: Spacing['4'],
    paddingVertical: Spacing['3'],
    alignItems: 'center',
  },
  modalCloseButtonText: {
     fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.subtle,
  },
});
