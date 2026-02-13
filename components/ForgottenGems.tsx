import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/client';
import { projects as projectsTable, type Project } from '../db/models/project';
import { tags as tagsTable } from '../db/models/tag';
import { CardWithDetails, getForgottenGems, setCardInReviewQueue, updateCardContent, updateCardProject, updateCardTags } from '../db/services/cards';
import { CardListItem } from './CardListItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ForgottenGems() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [fetchedCards, fetchedProjects, fetchedTags] = await Promise.all([
        getForgottenGems(user.id),
        db.select().from(projectsTable),
        db.select({ name: tagsTable.name }).from(tagsTable),
      ]);
      
      setCards(fetchedCards);
      setAvailableProjects(fetchedProjects);
      setAvailableTags(fetchedTags.map(t => t.name).sort());
    } catch (error) {
      console.error('Failed to fetch data for Forgotten Gems:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const handleUpdateCard = () => {
    // Refresh data when a card is updated (e.g. content edit)
    // Actually we can just update local state if we want to be optimistic/faster
    // But for now let's just re-fetch or maybe just let it be since it's "Forgotten Gems"
    // Fetching again might replace them with new random ones which is bad UX while editing.
    // So we should probably just keep them.
  };

  if (loading) return null; // Or a skeleton
  if (cards.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color={Colors.primary.base} />
        <Text style={styles.title}>Forgotten Gems</Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH - (Spacing['5'] * 2)} // Adjust for padding
        snapToAlignment="center"
        disableIntervalMomentum={true}
      >
        {cards.map((card, index) => (
          <View key={card.id} style={styles.cardWrapper}>
            <CardListItem
              content={card.content}
              sourceNoteTitle={card.sourceNoteTitle}
              createdAt={card.createdAt}
              lastSeen={card.lastSeen}
              timesSeen={card.timesSeen}
              intervalDays={card.intervalDays}
              inReviewQueue={card.inReviewQueue}
              extractionMethod={card.extractionMethod as any}
              tags={card.tags}
              projectId={card.projectId}
              availableProjects={availableProjects}
              availableTags={availableTags}
              onSaveContent={async (newContent) => {
                await updateCardContent(card.id, newContent);
                handleUpdateCard();
              }}
              onUpdateProject={async (projectId) => {
                await updateCardProject(card.id, projectId);
                 handleUpdateCard();
              }}
              onUpdateTags={async (tags) => {
                await updateCardTags(card.id, tags);
                 handleUpdateCard();
              }}
              onUpdateReviewQueue={async (inQueue) => {
                await setCardInReviewQueue(card.id, inQueue);
                 handleUpdateCard();
              }}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {cards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing['6'],
    marginBottom: Spacing['2'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    marginBottom: Spacing['3'],
    paddingHorizontal: Spacing['1'],
  },
  title: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  scrollContent: {
    paddingBottom: Spacing['2'],
  },
  cardWrapper: {
    width: SCREEN_WIDTH - (Spacing['5'] * 2), // Full width minus container padding
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing['2'],
    marginTop: Spacing['2'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary.base,
    width: 24, // Elongated active dot
  },
  inactiveDot: {
    backgroundColor: Colors.border.subtle,
  },
});
