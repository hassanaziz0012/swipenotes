import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeCard from '../../components/SwipeCard';
import { Colors, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { type Project } from '../../db/models/project';
import { getProjectById, getSourceNoteById, setCardInReviewQueue } from '../../db/services';
import { retrieve_eligible_cards } from '../../utils/swipeSession';

export default function StudyScreen() {
    const { user } = useAuth();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Record<number, Project>>({});
    const [sourceNoteTitles, setSourceNoteTitles] = useState<Record<number, string>>({});

    useEffect(() => {
        const fetchCards = async () => {
            if (user) {
                try {
                    const fetchedCards = await retrieve_eligible_cards(user.id);
                    setCards(fetchedCards);

                    // Fetch projects and source notes for the cards
                    const projectsMap: Record<number, Project> = {};
                    const sourceNotesMap: Record<number, string> = {};

                    for (const card of fetchedCards) {
                        // Fetch project if we haven't already
                        if (card.projectId && !projectsMap[card.projectId]) {
                            const project = await getProjectById(card.projectId);
                            if (project) {
                                projectsMap[card.projectId] = project;
                            }
                        }
                        // Fetch source note if we haven't already
                        if (card.sourceNoteId && !sourceNotesMap[card.sourceNoteId]) {
                            const sourceNote = await getSourceNoteById(card.sourceNoteId);
                            if (sourceNote) {
                                sourceNotesMap[card.sourceNoteId] = sourceNote.originalFileName;
                            }
                        }
                    }

                    setProjects(projectsMap);
                    setSourceNoteTitles(sourceNotesMap);
                } catch (error) {
                    console.error("Failed to fetch cards:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCards();
    }, [user]);

    const handleSwipeLeft = (cardId: number) => {
        // Remove card from stack
        setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
        // TODO: Update stats for card (left swipe - forgotten/hard)
        console.log(`Swiped left on card ${cardId}`);
    };

    const handleSwipeRight = async (cardId: number) => {
        // Remove card from stack
        setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
        // Set the card's inReviewQueue property to true
        try {
            await setCardInReviewQueue(cardId, true);
            console.log(`Swiped right on card ${cardId} - added to review queue`);
        } catch (error) {
            console.error(`Failed to add card ${cardId} to review queue:`, error);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary.base} />
            </View>
        );
    }

    if (cards.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No cards for review right now!</Text>
                <Text style={styles.subText}>Great job keeping up.</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.cardStack}>
                {cards.map((card, index) => {
                    // Only render the top 3 cards for performance, but need to keep others in state
                    if (index > 2) return null;
                    return (
                        <SwipeCard
                            key={card.id}
                            card={card}
                            index={index}
                            onSwipeLeft={() => handleSwipeLeft(card.id)}
                            onSwipeRight={() => handleSwipeRight(card.id)}
                            project={card.projectId ? projects[card.projectId] : undefined}
                            sourceNoteTitle={sourceNoteTitles[card.sourceNoteId]}
                        />
                    );
                }).reverse()} 
            </View>
             <View style={styles.footer}>
                <Text style={styles.counter}>{cards.length} cards remaining</Text>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
        paddingTop: 60,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background.base,
    },

    cardStack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    emptyText: {
        ...Typography.xl,
        color: Colors.text.base,
        marginBottom: 8,
    },
    subText: {
        ...Typography.body,
        color: Colors.text.subtle,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    counter: {
        ...Typography.caption,
        color: Colors.text.subtle,
    }
});
