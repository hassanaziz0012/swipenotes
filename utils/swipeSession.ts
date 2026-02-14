import { db } from "../db/client";
import { type Card } from '../db/models/card';
import { type Project } from '../db/models/project';
import { type Session } from '../db/models/session';
import { getProjectById, getSessionById, getSourceNoteById, updateCard, updateSession } from '../db/services';
import { queryEligibleCards } from "./cardQueries";

export async function retrieve_eligible_cards(userId: number) {
    return queryEligibleCards(userId, db);
}

// Spaced repetition intervals (in days), capping at 90
export const INTERVALS = [1, 3, 7, 14, 30, 60, 90];
export const RANDOMNESS_FACTOR = 0.2; // ±20%

/**
 * Calculate the next interval for a card based on its current intervalDays and swipe direction.
 * - Left swipe: progress to next interval with ±20% randomness
 * - Right swipe: add to review queue, don't change interval
 */
export function calculateNextInterval(card: { intervalDays: number }, direction: 'left' | 'right'): { intervalDays: number; actualInterval: number } | null {
    if (direction === 'right') {
        // Right swipe = review queue, no interval change
        return null;
    }

    // Left swipe = card learned, progress to next interval
    const currentIndex = INTERVALS.indexOf(card.intervalDays);
    let nextIndex: number;

    if (currentIndex === -1) {
        // Card has never been seen (intervalDays = 0 or 1) or has a non-standard interval
        // Start at the first interval (3 days)
        nextIndex = 0;
    } else {
        // Progress to next interval, capping at the last one (90 days)
        nextIndex = Math.min(currentIndex + 1, INTERVALS.length - 1);
    }

    const baseInterval = INTERVALS[nextIndex];

    // Add randomness: ±20%
    const randomOffset = baseInterval * RANDOMNESS_FACTOR;
    const actualInterval = baseInterval + (Math.random() * randomOffset * 2 - randomOffset);

    return {
        intervalDays: INTERVALS[nextIndex], // Store the base interval for progression tracking
        actualInterval: Math.round(actualInterval), // The actual days to add (with randomness)
    };
}

export async function loadSessionAndCardsData(sessionId: string, userId: number | undefined) {
    if (!userId || !sessionId) return null;

    try {
        const session = await getSessionById(Number(sessionId));
        if (!session || !session.cards) return null;

        const sessionCards = session.cards as Card[];
        
        // Restore history and stats
        const history = session.swipeHistory || [];
        const cardsSwipedCount = session.cardsSwiped || 0;

        // Filter out already swiped cards
        const swipedCardIds = new Set(history.map((h: any) => h.cardId));
        const remainingCards = sessionCards.filter(c => !swipedCardIds.has(c.id));
        
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

        return {
            session: session as Session,
            sessionCards,
            remainingCards,
            swipeHistory: history,
            cardsSwipedCount,
            projectsMap,
            sourceNotesMap
        };
    } catch (error) {
        console.error("Failed to load session:", error);
        throw error;
    }
}

export async function endSwipeSession(
    sessionId: number,
    swipeHistory: any[],
    allSessionCards: any[]
) {
    // 1. Build update map for all swiped cards
    const cardUpdates = new Map<number, {
        timesSeen: number,
        timesLeftSwiped: number,
        timesRightSwiped: number,
        lastSeen: Date,
        intervalDays: number,
    }>();

    // Initialize with current values from allSessionCards
    allSessionCards.forEach(card => {
        cardUpdates.set(card.id, {
            timesSeen: card.timesSeen || 0,
            timesLeftSwiped: card.timesLeftSwiped || 0,
            timesRightSwiped: card.timesRightSwiped || 0,
            lastSeen: card.lastSeen ? new Date(card.lastSeen) : new Date(),
            intervalDays: card.intervalDays || 0,
        });
    });

    // Apply updates from swipe history
    const now = new Date();

    swipeHistory.forEach(swipe => {
        const current = cardUpdates.get(swipe.cardId);
        if (current) {
            current.timesSeen += 1;
            current.lastSeen = now;
            
            if (swipe.direction === 'left') {
                current.timesLeftSwiped += 1;

                // Calculate next spaced repetition interval
                const intervalResult = calculateNextInterval(
                    { intervalDays: current.intervalDays },
                    'left'
                );
                if (intervalResult) {
                    current.intervalDays = intervalResult.intervalDays;
                }
            } else {
                current.timesRightSwiped += 1;
                // Right swipe = review queue, interval stays the same
            }

            cardUpdates.set(swipe.cardId, current);
        }
    });

    // 2. Perform DB updates (only for cards that were actually swiped)
    const swipedCardIds = new Set(swipeHistory.map(h => h.cardId));
    
    const updatePromises = Array.from(swipedCardIds).map(cardId => {
        const updates = cardUpdates.get(cardId);
        if (updates) {
            return updateCard(cardId, updates);
        }
        return Promise.resolve();
    });

    await Promise.all(updatePromises);

    // 3. Mark session as ended
    await updateSession(sessionId, {
        isActive: false,
        endedAt: new Date()
    });
}
