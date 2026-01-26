import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { sourceNotes } from '../db/models/sourcenote';

export const processTextExtraction = async (text: string, userId: number, fileName: string = "Unknown") => {
    try {
        // 1. Generate SHA-256 hash
        const contentHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            text
        );

        // 2. Create SourceNote
        const result = await db.insert(sourceNotes).values({
            userId,
            originalFileName: fileName,
            importDate: new Date(),
            rawContent: text,
            contentHash,
            fileSize: new Blob([text]).size, // Approximate size in bytes
        }).returning({ id: sourceNotes.id });

        const sourceNoteId = result[0].id;

        // 3. Check word count and delegate
        const wordCount = text.trim().split(/\s+/).length;

        if (wordCount <= 250) {
            return await extract_full(text, userId, sourceNoteId, wordCount);
        } else {
            return await extract_chunks(text, userId, sourceNoteId, wordCount);
        }

    } catch (error) {
        console.error("Error in processTextExtraction:", error);
        throw error;
    }
};

const extract_full = async (text: string, userId: number, sourceNoteId: number, wordCount: number) => {
    try {
        const result = await db.insert(cards).values({
            userId,
            sourceNoteId,
            content: text,
            createdAt: new Date(),
            intervalDays: 1,
            timesSeen: 0,
            timesLeftSwiped: 0,
            timesRightSwiped: 0,
            inReviewQueue: false,
            wordCount,
            extractionMethod: 'full',
        }).returning();
        return result;
    } catch (error) {
        console.error("Error in extract_full:", error);
        throw new Error("Failed to create card from full text.");
    }
};

const extract_chunks = async (text: string, userId: number, sourceNoteId: number, wordCount: number) => {
    // Placeholder for future logic
    throw new Error(`Text length (${wordCount} words) exceeds 250 words limit. Chunking not yet implemented.`);
};
