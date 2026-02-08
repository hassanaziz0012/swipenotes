import { type Card } from '@/db/models/card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { CardCountsByProject } from '../components/CardCountsByProject';
import SessionDetails from '../components/SessionDetails';
import SwipeCard from '../components/SwipeCard';
import { Colors, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../db/models/project';
import { type Session } from '../db/models/session';
import { getProjectById, getSessionById, getSourceNoteById, setCardInReviewQueue, updateCard, updateSession } from '../db/services';

export default function SwipeSessionScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { sessionId, limitReached: limitReachedParam } = useLocalSearchParams<{ sessionId: string, limitReached: string }>();
    const [cards, setCards] = useState<any[]>([]);
    const [allSessionCards, setAllSessionCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(limitReachedParam === "true");
    const [projects, setProjects] = useState<Record<number, Project>>({});
    const [sourceNoteTitles, setSourceNoteTitles] = useState<Record<number, string>>({});
    const [session, setSession] = useState<Session | null>(null);
    const [showToast, setShowToast] = useState(false);
    const toastOpacity = useRef(new RNAnimated.Value(0)).current;
    
    // Track session stats locally
    const [cardsSwipedCount, setCardsSwipedCount] = useState(0);
    const [swipeHistory, setSwipeHistory] = useState<any[]>([]);
    const [isEndingSession, setIsEndingSession] = useState(false);

    // Shared value for active card swipe position
    const activeTranslationX = useSharedValue(0);

    // Animated styles for hints
    const leftHintStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                activeTranslationX.value,
                [0, -50],
                [0, 1],
                Extrapolation.CLAMP
            ),
            transform: [
                { scale: interpolate(activeTranslationX.value, [0, -50], [0.8, 1], Extrapolation.CLAMP) }
            ]
        };
    });

    const rightHintStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                activeTranslationX.value,
                [0, 50],
                [0, 1],
                Extrapolation.CLAMP
            ),
            transform: [
                { scale: interpolate(activeTranslationX.value, [0, 50], [0.8, 1], Extrapolation.CLAMP) }
            ]
        };
    });

    useEffect(() => {
        if (showToast) {
            // Fade in
            RNAnimated.timing(toastOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Auto-hide after 2 seconds
            const timer = setTimeout(() => {
                RNAnimated.timing(toastOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => setShowToast(false));
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        const loadSessionAndCards = async () => {
            if (user && sessionId) {
                try {
                    const session = await getSessionById(Number(sessionId));
                    if (session && session.cards) {
                        setSession(session as Session);
                        const sessionCards = session.cards as Card[];
                        
                        // Restore history and stats
                        const history = session.swipeHistory || [];
                        setSwipeHistory(history);
                        setCardsSwipedCount(session.cardsSwiped || 0);

                        // Filter out already swiped cards
                        const swipedCardIds = new Set(history.map((h: any) => h.cardId));
                        const remainingCards = sessionCards.filter(c => !swipedCardIds.has(c.id));
                        
                        setCards(remainingCards);
                        setAllSessionCards(sessionCards);
                        
                        // Fetch projects and source notes for the cards
                        const projectsMap: Record<number, Project> = {};
                        const sourceNotesMap: Record<number, string> = {};

                        for (const card of sessionCards) {
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
                    }
                } catch (error) {
                    console.error("Failed to load session:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadSessionAndCards();
    }, [user, sessionId]);

    // Update only swipe history in DB as we go
    useEffect(() => {
        if (sessionId && !loading) {
            updateSession(Number(sessionId), {
                cardsSwiped: cardsSwipedCount,
                swipeHistory: swipeHistory
            }).catch(err => console.error("Failed to update session:", err));
        }
    }, [cardsSwipedCount, swipeHistory, sessionId, loading]);

    const onCardSwipe = async (cardId: number, direction: 'left' | 'right') => {
        // Just update local stats and history
        setCardsSwipedCount(prev => prev + 1);
        setSwipeHistory(prev => [...prev, { cardId, direction, timestamp: new Date() }]);
    };

    const handleSwipeLeft = async (cardId: number) => {
        // Remove card from stack
        setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
        await onCardSwipe(cardId, 'left');
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
        } catch (error) {
            console.error(`Failed to add card ${cardId} to review queue:`, error);
        }
    };

    const handleEndSession = async () => {
        if (!sessionId || isEndingSession) return;
        setIsEndingSession(true);

        try {
            // 1. Update all cards based on swipe history
            // We'll iterate through all cards in the session and apply updates if they were swiped
            const cardUpdates = new Map<number, {
                timesSeen: number,
                timesLeftSwiped: number,
                timesRightSwiped: number,
                lastSeen: Date
            }>();

            // Initialize with current values from allSessionCards
            allSessionCards.forEach(card => {
                cardUpdates.set(card.id, {
                    timesSeen: card.timesSeen || 0,
                    timesLeftSwiped: card.timesLeftSwiped || 0,
                    timesRightSwiped: card.timesRightSwiped || 0,
                    lastSeen: new Date(card.lastSeen) // keep original lastSeen initially
                });
            });

            // Apply updates from history
            // Use a specific timestamp for this batch update for consistency
            const now = new Date();

            swipeHistory.forEach(swipe => {
                const current = cardUpdates.get(swipe.cardId);
                if (current) {
                    current.timesSeen += 1;
                    current.lastSeen = now;
                    
                    if (swipe.direction === 'left') {
                        current.timesLeftSwiped += 1;
                    } else {
                        current.timesRightSwiped += 1;
                    }
                    cardUpdates.set(swipe.cardId, current);
                }
            });

            // Perform DB updates
            // Filter to only cards that were actually swiped
            const swipedCardIds = new Set(swipeHistory.map(h => h.cardId));
            
            const updatePromises = Array.from(swipedCardIds).map(cardId => {
                const updates = cardUpdates.get(cardId);
                if (updates) {
                    return updateCard(cardId, updates);
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);

            // 2. Mark session as ended
            await updateSession(Number(sessionId), {
                isActive: false,
                endedAt: new Date()
            });

            // 3. Navigate back
            router.back();

        } catch (error) {
            console.error("Failed to end session:", error);
            // Optionally show error to user
        } finally {
            setIsEndingSession(false);
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
        // Create an updated session object for display
        const displaySession: Session | null = session ? {
            ...session,
            cardsSwiped: cardsSwipedCount,
            // We can approximate the end time for display purposes if not set
            endedAt: session.endedAt || new Date(),
        } : null;

        // Compute project counts from swipe history
        const projectCountsMap = new Map<number, { project: { id: number; name: string; color: string }; count: number }>();
        
        swipeHistory.forEach(swipe => {
            const card = allSessionCards.find(c => c.id === swipe.cardId);
            if (card && card.projectId && projects[card.projectId]) {
                const project = projects[card.projectId];
                const existing = projectCountsMap.get(project.id);
                if (existing) {
                    existing.count += 1;
                } else {
                    projectCountsMap.set(project.id, {
                        project: { id: project.id, name: project.name, color: project.color },
                        count: 1
                    });
                }
            }
        });

        const projectCounts = Array.from(projectCountsMap.values()).sort((a, b) => b.count - a.count);

        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>{limitReached ? "Daily card limit reached" : "Session Complete!"}</Text>
                <Text style={styles.subText}>{limitReached ? "Come back tomorrow for more!" : "Great job keeping up."}</Text>
                

                <TouchableOpacity 
                    style={[styles.button, { marginTop: 30, width: '100%', maxWidth: 400 }]} 
                    onPress={handleEndSession}
                    disabled={isEndingSession}
                    >
                     {isEndingSession ? (
                         <ActivityIndicator color={Colors.background.base} />
                        ) : (
                            <Text style={styles.buttonText}>End Session</Text>
                        )}
                </TouchableOpacity>
                
                {displaySession && (
                    <SessionDetails 
                        session={displaySession} 
                        containerStyle={{ marginTop: 30, width: '100%', maxWidth: 400 }}
                    />
                )}

                {projectCounts.length > 0 && (
                    <CardCountsByProject
                        projectCounts={projectCounts}
                        title="Cards Studied by Project"
                        style={{ marginTop: 20, width: '100%', maxWidth: 400 }}
                    />
                )}
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            {showToast && (
                <RNAnimated.View style={[styles.toast, { opacity: toastOpacity }]}>
                    <Text style={styles.toastText}>Added to review queue</Text>
                </RNAnimated.View>
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
                            activeTranslationX={index === 0 ? activeTranslationX : undefined}
                        />
                    );
                }).reverse()} 
            </View>
             
             {/* Hints Container */}
             <View style={styles.hintsContainer}>
                <Animated.View style={[styles.hint, styles.leftHint, leftHintStyle]}>
                    <Text style={styles.hintText}>Skip</Text>
                </Animated.View>
                <Animated.View style={[styles.hint, styles.rightHint, rightHintStyle]}>
                    <Text style={styles.hintText}>Add to Review</Text>
                </Animated.View>
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
        paddingHorizontal: 20,
    },

    cardStack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
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
        zIndex: 0,
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
    },
    button: {
        backgroundColor: Colors.primary.base,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        ...Typography.body,
        color: Colors.background.base,
        fontWeight: 'bold',
        fontSize: 18,
    },
    hintsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        marginBottom: 20,
        height: 50,
        alignItems: 'center',
    },
    hint: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 2,
    },
    leftHint: {
        borderColor: Colors.status.error || '#EF4444',
        backgroundColor: (Colors.status.error || '#EF4444') + '20', // 20% opacity
    },
    rightHint: {
        borderColor: Colors.status.success || '#22C55E',
        backgroundColor: (Colors.status.success || '#22C55E') + '20', // 20% opacity
    },
    hintText: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text.base,
    }
});
