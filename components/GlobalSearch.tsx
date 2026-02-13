import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import {
    searchCards,
    searchSourceNotes,
    type CardSearchResult,
    type SourceNoteSearchResult,
} from '../db/services/search';
import { ContentModal } from './ContentModal';
import { TextMarkdownDisplay } from './TextMarkdownDisplay';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

function truncatePreview(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function GlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cardResults, setCardResults] = useState<CardSearchResult[]>([]);
  const [noteResults, setNoteResults] = useState<SourceNoteSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [selectedNote, setSelectedNote] = useState<SourceNoteSearchResult | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!user || searchQuery.length < MIN_QUERY_LENGTH) {
        setCardResults([]);
        setNoteResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      try {
        const [cards, notes] = await Promise.all([
          searchCards(user.id, searchQuery),
          searchSourceNotes(user.id, searchQuery),
        ]);
        setCardResults(cards);
        setNoteResults(notes);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [user]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (text.length < MIN_QUERY_LENGTH) {
        setCardResults([]);
        setNoteResults([]);
        setHasSearched(false);
        return;
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(text);
      }, DEBOUNCE_MS);
    },
    [performSearch]
  );

  const clearSearch = () => {
    setQuery('');
    setCardResults([]);
    setNoteResults([]);
    setHasSearched(false);
  };

  const totalResults = cardResults.length + noteResults.length;
  const showResults = hasSearched || isSearching;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={isFocused ? Colors.primary.base : Colors.text.subtle}
        />
        <TextInput
          style={styles.input}
          placeholder="Search cards & source notes…"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={20} color={Colors.text.subtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {showResults && (
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary.base} />
              <Text style={styles.loadingText}>Searching…</Text>
            </View>
          ) : totalResults === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={32} color={Colors.text.subtle} />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          ) : (
            <>
              {/* Cards Section */}
              {cardResults.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="albums-outline" size={18} color={Colors.primary.base} />
                    <Text style={styles.sectionTitle}>
                      Cards ({cardResults.length})
                    </Text>
                  </View>
                  {cardResults.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={styles.resultItem}
                      onPress={() => setSelectedCard(card)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultItemContent}>
                        <Text style={styles.resultItemTitle} numberOfLines={2}>
                          {truncatePreview(card.content, 100)}
                        </Text>
                        <View style={styles.resultItemMeta}>
                          <Ionicons name="document-text-outline" size={12} color={Colors.text.subtle} />
                          <Text style={styles.resultItemMetaText} numberOfLines={1}>
                            {card.sourceNoteTitle}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.text.subtle} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Source Notes Section */}
              {noteResults.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.primary.base} />
                    <Text style={styles.sectionTitle}>
                      Source Notes ({noteResults.length})
                    </Text>
                  </View>
                  {noteResults.map((note) => (
                    <TouchableOpacity
                      key={note.id}
                      style={styles.resultItem}
                      onPress={() => setSelectedNote(note)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultItemContent}>
                        <Text style={styles.resultItemTitle} numberOfLines={1}>
                          {note.originalFileName}
                        </Text>
                        <Text style={styles.resultItemPreview} numberOfLines={2}>
                          {truncatePreview(note.rawContent, 100)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.text.subtle} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Card Detail Modal */}
      <ContentModal
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title="Card"
      >
        <TextMarkdownDisplay>{selectedCard?.content || ''}</TextMarkdownDisplay>
        {selectedCard?.sourceNoteTitle && (
          <View style={styles.modalMeta}>
            <Ionicons name="document-text-outline" size={14} color={Colors.text.subtle} />
            <Text style={styles.modalMetaText}>
              From: {selectedCard.sourceNoteTitle}
            </Text>
          </View>
        )}
      </ContentModal>

      {/* Source Note Detail Modal */}
      <ContentModal
        visible={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote?.originalFileName || 'Source Note'}
      >
        <TextMarkdownDisplay>{selectedNote?.rawContent || ''}</TextMarkdownDisplay>
      </ContentModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: Spacing['3'],
    height: 48,
    gap: Spacing['2'],
  },
  inputContainerFocused: {
    borderColor: Colors.primary.base,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    ...Typography.base,
    fontFamily: FontFamily.regular,
    color: Colors.text.base,
    paddingVertical: 0,
  },
  resultsContainer: {
    marginTop: Spacing['3'],
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['5'],
    gap: Spacing['2'],
  },
  loadingText: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['6'],
    gap: Spacing['2'],
  },
  emptyText: {
    ...Typography.base,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  emptySubtext: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
  section: {
    paddingBottom: Spacing['2'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    backgroundColor: Colors.background.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  sectionTitle: {
    ...Typography.sm,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  resultItemContent: {
    flex: 1,
    marginRight: Spacing['2'],
  },
  resultItemTitle: {
    ...Typography.sm,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
    marginBottom: 2,
  },
  resultItemPreview: {
    ...Typography.xs,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
  resultItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  resultItemMetaText: {
    ...Typography.xs,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    flexShrink: 1,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    marginTop: Spacing['4'],
    paddingTop: Spacing['3'],
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  modalMetaText: {
    ...Typography.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
});
