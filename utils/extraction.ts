import { and, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { sourceNotes } from '../db/models/sourcenote';
import { cardTags, tags as tagsTable } from '../db/models/tag';

export const processTextExtraction = async (text: string, userId: number, fileName: string = "Unknown", extractionMethod: 'manual' | 'ai' = 'manual') => {
    try {
        // If extraction method is AI, delegate to extractWithAI
        if (extractionMethod === 'ai') {
            const result = await extractWithAI(text, [], userId, fileName);
            return result.cards;
        }

        // Manual extraction flow
        // 1. Generate SHA-256 hash
        const contentHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            text
        );

        // Check if source note already exists
        const existingNote = await db.select().from(sourceNotes).where(
            and(
                eq(sourceNotes.contentHash, contentHash),
                eq(sourceNotes.userId, userId)
            )
        );

        if (existingNote.length > 0) {
            throw new Error("This source note has already been added.");
        }

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

const createCard = async (userId: number, sourceNoteId: number, content: string, wordCount: number, extractionMethod: 'full' | 'chunk_header' | 'chunk_paragraph' | 'ai', tags: string[] = []) => {
    // Use transaction to ensure card and tags are created together
    return await db.transaction(async (tx) => {
        // 1. Create Card
        const insertedCards = await tx.insert(cards).values({
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

        if (insertedCards.length === 0) return [];
        const cardId = insertedCards[0].id;

        // 2. Associate Tags
        if (tags.length > 0) {
            for (const tagName of tags) {
                if (!tagName.trim()) continue;

                // Upsert tag
                let tagId: number;
                const existingTag = await tx.select().from(tagsTable).where(eq(tagsTable.name, tagName)).limit(1);

                if (existingTag.length > 0) {
                    tagId = existingTag[0].id;
                } else {
                    const newTag = await tx.insert(tagsTable).values({ name: tagName }).returning({ id: tagsTable.id });
                    tagId = newTag[0].id;
                }

                // Link to card
                await tx.insert(cardTags).values({
                    cardId,
                    tagId
                });
            }
        }

        return insertedCards;
    });
};


// UsageMetadata represents usage stats if provided
interface UsageMetadata {
    [key: string]: any;
}

// AIExtractionRequest represents the incoming request body
interface AIExtractionRequest {
    content: string;
    existing_tags: string[];
}

// AIExtractionResponse represents the response from this API
interface AIExtractionResponse {
    text: string;
    model: string;
    usage_metadata?: UsageMetadata;
    finish_reason?: string;
}

// ErrorResponse represents an error response
interface ErrorResponse {
    error: string;
}

// Interface for parsed AI extraction card
interface AIExtractedCard {
    content: string;
    suggested_tags: string[];
}

// Interface for parsed AI extraction result
interface AIExtractionResult {
    cards: AIExtractedCard[];
}

export const extractWithAI = async (content: string, existingTags: string[], userId: number, fileName: string = "Unknown") => {
    try {
        // 1. Generate SHA-256 hash and check for duplicates
        const contentHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            content
        );

        const existingNote = await db.select().from(sourceNotes).where(
            and(
                eq(sourceNotes.contentHash, contentHash),
                eq(sourceNotes.userId, userId)
            )
        );

        if (existingNote.length > 0) {
            throw new Error("This source note has already been added.");
        }

        // 2. Call AI extraction API
        const response = await fetch('https://swipenotes-api.vercel.app/api/ai-extraction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                existing_tags: existingTags,
            } as AIExtractionRequest),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI Extraction failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`AI Extraction failed: ${response.status}`);
        }

        const data = await response.json() as AIExtractionResponse;
        console.log("AI Extraction Response:", JSON.stringify(data, null, 2));

        // 3. Parse JSON from the response text (may be wrapped in markdown code block)
        const parsedCards = parseAIExtractionText(data.text);
        
        if (!parsedCards || parsedCards.cards.length === 0) {
            throw new Error("No cards extracted from AI response");
        }

        // 4. Create SourceNote
        const result = await db.insert(sourceNotes).values({
            userId,
            originalFileName: fileName,
            importDate: new Date(),
            rawContent: content,
            contentHash,
            fileSize: new Blob([content]).size,
        }).returning({ id: sourceNotes.id });

        const sourceNoteId = result[0].id;

        // 5. Create cards with tags using existing createCard function
        const createdCards: any[] = [];
        for (const card of parsedCards.cards) {
            const wordCount = card.content.trim().split(/\s+/).length;
            const createdCard = await createCard(userId, sourceNoteId, card.content, wordCount, 'ai', card.suggested_tags);
            createdCards.push(...createdCard);
        }

        return { sourceNoteId, cards: createdCards };

    } catch (error) {
        console.error("Error in extractWithAI:", error);
        throw error;
    }
};

// Helper function to parse AI extraction text (handles markdown code blocks)
const parseAIExtractionText = (text: string): AIExtractionResult | null => {
    try {
        // Remove markdown code block wrapper if present
        let jsonString = text.trim();
        
        // Check if wrapped in ```json ... ``` or ``` ... ```
        const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1].trim();
        }

        const parsed = JSON.parse(jsonString) as AIExtractionResult;
        return parsed;
    } catch (error) {
        console.error("Failed to parse AI extraction JSON:", error);
        return null;
    }
};
