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
        return await createCard(userId, sourceNoteId, text, wordCount, 'full');
    } catch (error) {
        console.error("Error in extract_full:", error);
        throw new Error("Failed to create card from full text.");
    }
};

const extract_chunks = async (text: string, userId: number, sourceNoteId: number, wordCount: number) => {
    // Split by Markdown headers (recursive lookahead ensuring we identify headers at start of lines)
    // The regex /(?=^#+\s)/hm treats the string as multiline and matches position before a header
    const sections = text.split(/(?=^#+\s)/gm).filter(s => s.trim().length > 0);

    const allCards: any[] = [];

    for (const section of sections) {
        const cards = await extractSection(section, userId, sourceNoteId);
        allCards.push(...cards);
    }

    return allCards;
};

const extractSection = async (text: string, userId: number, sourceNoteId: number) => {
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount <= 250) {
        try {
            return await createCard(userId, sourceNoteId, text.trim(), wordCount, 'chunk_header');
        } catch (error) {
            console.error("Error in extractSection:", error);
            throw new Error("Failed to create card from section.");
        }
    } else {
        return await extractParagraph(text, userId, sourceNoteId);
    }
};

const extractParagraph = async (text: string, userId: number, sourceNoteId: number) => {
    const paragraphs = text.split(/\n\s*\n/);
    const createdCards: any[] = [];
    
    let currentChunk = "";
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
        const paraWordCount = paragraph.trim().split(/\s+/).length;

        // Validating if adding the next paragraph stays within limit
        if (currentWordCount + paraWordCount <= 250) {
            currentChunk = currentChunk ? currentChunk + "\n\n" + paragraph : paragraph;
            currentWordCount += paraWordCount;
        } else {
            // Save current chunk if it exists
            if (currentChunk.trim().length > 0) {
                try {
                    const result = await createCard(userId, sourceNoteId, currentChunk.trim(), currentWordCount, 'chunk_paragraph');
                    createdCards.push(...result);
                } catch (error) {
                    console.error("Error saving paragraph chunk:", error);
                }
            }
            
            // Start new chunk with the current paragraph
            currentChunk = paragraph;
            currentWordCount = paraWordCount;
        }
    }

    // Save any remaining chunk
    if (currentChunk.trim().length > 0) {
        try {
            const result = await createCard(userId, sourceNoteId, currentChunk.trim(), currentWordCount, 'chunk_paragraph');
            createdCards.push(...result);
        } catch (error) {
            console.error("Error saving final paragraph chunk:", error);
        }
    }

    return createdCards;
};

const createCard = async (userId: number, sourceNoteId: number, content: string, wordCount: number, extractionMethod: 'full' | 'chunk_header' | 'chunk_paragraph' | 'ai') => {
    return await db.insert(cards).values({
        userId,
        sourceNoteId,
        content,
        createdAt: new Date(),
        intervalDays: 1,
        timesSeen: 0,
        timesLeftSwiped: 0,
        timesRightSwiped: 0,
        inReviewQueue: false,
        wordCount,
        extractionMethod,
    }).returning();
};
