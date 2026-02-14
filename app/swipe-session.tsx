import SwipeSessionComplete from '@/components/SwipeSessionComplete';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import SwipeCard from '../components/SwipeCard';
import { Colors, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../db/models/project';
import { type Session } from '../db/models/session';
import { setCardInReviewQueue, updateSession } from '../db/services';
import { endSwipeSession, loadSessionAndCardsData } from '../utils/swipeSession';


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
        const loadData = async () => {
            if (user && sessionId) {
                try {
                    const data = await loadSessionAndCardsData(sessionId, user.id);
                    if (data) {
                        setSession(data.session);
                        setSwipeHistory(data.swipeHistory);
                        setCardsSwipedCount(data.cardsSwipedCount);
                        setCards(data.remainingCards);
                        setAllSessionCards(data.sessionCards);
                        setProjects(data.projectsMap);
                        setSourceNoteTitles(data.sourceNotesMap);
                    }
                } catch (error) {
                    console.error("Failed to load session:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
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

    const handleUndo = async () => {
        if (swipeHistory.length === 0) return;

        const lastSwipe = swipeHistory[swipeHistory.length - 1];
        const previousHistory = swipeHistory.slice(0, -1);

        // 1. Remove from history
        setSwipeHistory(previousHistory);

        // 2. Decrement count
        setCardsSwipedCount(prev => Math.max(0, prev - 1));

        // 3. Find card and add back to stack
        const cardToRestore = allSessionCards.find(c => c.id === lastSwipe.cardId);
        if (cardToRestore) {
            setCards(prev => [cardToRestore, ...prev]);
        }

        // 4. Revert review queue status if needed
        if (lastSwipe.direction === 'right') {
             try {
                await setCardInReviewQueue(lastSwipe.cardId, false);
            } catch (error) {
                console.error(`Failed to remove card ${lastSwipe.cardId} from review queue:`, error);
            }
        }
    };

    const handleEndSession = async () => {
        if (!sessionId || isEndingSession) return;
        setIsEndingSession(true);

        try {
            await endSwipeSession(Number(sessionId), swipeHistory, allSessionCards);
            
            // 4. Navigate back
            router.back();

        } catch (error) {
            console.error("Failed to end session:", error);
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

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.header}>
                 <TouchableOpacity 
                    style={[styles.undoButton, swipeHistory.length === 0 && styles.undoButtonDisabled]} 
                    onPress={handleUndo}
                    disabled={swipeHistory.length === 0}
                >
                    <Ionicons name="arrow-undo" size={24} color={swipeHistory.length === 0 ? Colors.text.subtle : Colors.primary.base} />
                </TouchableOpacity>
            </View>

            {cards.length === 0 ? (
                <SwipeSessionComplete
                    session={session}
                    cardsSwipedCount={cardsSwipedCount}
                    swipeHistory={swipeHistory}
                    allSessionCards={allSessionCards}
                    projects={projects}
                    limitReached={limitReached}
                    isEndingSession={isEndingSession}
                    handleEndSession={handleEndSession}
                />
            ) : (
                <>
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
                            <Text style={styles.hintText}>Next</Text>
                        </Animated.View>
                        <Animated.View style={[styles.hint, styles.rightHint, rightHintStyle]}>
                            <Text style={styles.hintText}>Add to Review</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.counter}>{cards.length} cards remaining</Text>
                        
                        <TouchableOpacity 
                            style={styles.endSessionLink} 
                            onPress={handleEndSession}
                            disabled={isEndingSession}
                        >
                            <Text style={styles.endSessionLinkText}>End Session Early</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
        paddingTop: 60,
    },
    header: {
        width: '100%',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 20,
        zIndex: 10,
    },
    undoButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    undoButtonDisabled: {
        opacity: 0.4,
        elevation: 0,
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
        borderColor: Colors.status.success || '#22C55E',
        backgroundColor: (Colors.status.success || '#22C55E') + '20', // 20% opacity
    },
    rightHint: {
        borderColor: Colors.primary.base,
        backgroundColor: 'hsla(15, 63%, 60%, 0.2)', // 20% opacity
    },
    hintText: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text.base,
    },
    endSessionLink: {
        marginTop: 16,
        padding: 8,
    },
    endSessionLinkText: {
        ...Typography.body,
        color: Colors.primary.base,
        textDecorationLine: 'underline',
    }
});

