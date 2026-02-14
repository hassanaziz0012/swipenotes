import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../constants/styles';
import { type Project } from '../db/models/project';
import { type Session } from '../db/models/session';
import SessionReview from './SessionReview';

interface SwipeSessionCompleteProps {
    session: Session | null;
    cardsSwipedCount: number;
    swipeHistory: any[];
    allSessionCards: any[];
    projects: Record<number, Project>;
    limitReached: boolean;
    isEndingSession: boolean;
    handleEndSession: () => void;
}

export default function SwipeSessionComplete({
    session,
    cardsSwipedCount,
    swipeHistory,
    allSessionCards,
    projects,
    limitReached,
    isEndingSession,
    handleEndSession,
}: SwipeSessionCompleteProps) {
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
                <SessionReview 
                    session={displaySession} 
                    projectCounts={projectCounts}
                    containerStyle={{ marginTop: 30, width: '100%', maxWidth: 400 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background.base,
        paddingHorizontal: 20,
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
});

