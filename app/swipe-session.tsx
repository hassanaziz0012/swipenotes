import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeCard from '../components/SwipeCard';
import { Colors, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../db/models/project';
import { getProjectById, getSourceNoteById, setCardInReviewQueue, updateCard, updateSession } from '../db/services';
import { retrieve_eligible_cards } from '../utils/swipeSession';

export default function SwipeSessionScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(false);
    const [projects, setProjects] = useState<Record<number, Project>>({});
    const [sourceNoteTitles, setSourceNoteTitles] = useState<Record<number, string>>({});
    const [showToast, setShowToast] = useState(false);
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // Track session stats locally
    const [cardsSwipedCount, setCardsSwipedCount] = useState(0);
    const [swipeHistory, setSwipeHistory] = useState<any[]>([]);

    useEffect(() => {
        if (showToast) {
            // Fade in
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Auto-hide after 2 seconds
            const timer = setTimeout(() => {
                Animated.timing(toastOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => setShowToast(false));
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        const fetchCards = async () => {
            if (user) {
                try {
                    // TODO: In a real "session" we might want to fetch cards specifically for this session
                    // For now, we use the same eligibility logic.
                    const { cards: fetchedCards, limitReached: isLimitReached } = await retrieve_eligible_cards(user.id);
                    setCards(fetchedCards);
                    setLimitReached(isLimitReached);

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

    // Update session in DB when local stats change
    useEffect(() => {
        if (sessionId) {
            updateSession(Number(sessionId), {
                cardsSwiped: cardsSwipedCount,
                swipeHistory: swipeHistory
            }).catch(err => console.error("Failed to update session:", err));
        }
    }, [cardsSwipedCount, swipeHistory, sessionId]);

    const onCardSwipe = async (cardId: number, direction: 'left' | 'right') => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const updates: any = {
            lastSeen: new Date(),
            timesSeen: (card.timesSeen || 0) + 1,
        };

        if (direction === 'left') {
            updates.timesLeftSwiped = (card.timesLeftSwiped || 0) + 1;
        } else {
            updates.timesRightSwiped = (card.timesRightSwiped || 0) + 1;
        }

        try {
            await updateCard(cardId, updates);
            
            // Update local session stats
            setCardsSwipedCount(prev => prev + 1);
            setSwipeHistory(prev => [...prev, { cardId, direction, timestamp: new Date() }]);

        } catch (error) {
            console.error(`Failed to update card stats for ${cardId}:`, error);
        }
    };

    const handleSwipeLeft = async (cardId: number) => {
        // Remove card from stack
        setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
        await onCardSwipe(cardId, 'left');
        console.log(`Swiped left on card ${cardId}`);
    };

    const handleSwipeRight = async (cardId: number) => {
        // Remove card from stack
        setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
        
        // Update stats
        await onCardSwipe(cardId, 'right');

        // Set the card's inReviewQueue property to true
        try {
            await setCardInReviewQueue(cardId, true);
            setShowToast(true);
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
                <Text style={styles.emptyText}>{limitReached ? "Daily card limit reached" : "No cards for review right now!"}</Text>
                <Text style={styles.subText}>{limitReached ? "Come back tomorrow for more!" : "Great job keeping up."}</Text>
                <Text style={[styles.linkText, { marginTop: 20 }]} onPress={() => router.back()}>
                    Return to Study Menu
                </Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            {showToast && (
                <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                    <Text style={styles.toastText}>Added to review queue</Text>
                </Animated.View>
            )}
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
    linkText: {
        ...Typography.body,
        color: Colors.primary.base,
        textDecorationLine: 'underline',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    counter: {
        ...Typography.caption,
        color: Colors.text.subtle,
    },
    toast: {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        backgroundColor: '#22C55E',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        zIndex: 100,
    },
    toastText: {
        ...Typography.body,
        color: Colors.background.base,
        fontWeight: '600',
    }
});
