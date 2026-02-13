import { and, eq, like, or } from 'drizzle-orm';
import { db } from '../client';
import { cards } from '../models/card';
import { sourceNotes } from '../models/sourcenote';

const MAX_RESULTS = 20;

export interface CardSearchResult {
  id: number;
  content: string;
  sourceNoteId: number;
  sourceNoteTitle: string;
  createdAt: Date;
  extractionMethod: string;
}

export interface SourceNoteSearchResult {
  id: number;
  originalFileName: string;
  rawContent: string;
  importDate: Date;
  fileSize: number;
}

export async function searchCards(userId: number, query: string): Promise<CardSearchResult[]> {
  try {
    const pattern = `%${query}%`;
    const results = await db
      .select({
        id: cards.id,
        content: cards.content,
        sourceNoteId: cards.sourceNoteId,
        sourceNoteTitle: sourceNotes.originalFileName,
        createdAt: cards.createdAt,
        extractionMethod: cards.extractionMethod,
      })
      .from(cards)
      .innerJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id))
      .where(
        and(
          eq(cards.userId, userId),
          like(cards.content, pattern)
        )
      )
      .limit(MAX_RESULTS);

    return results;
  } catch (error) {
    console.error('Failed to search cards:', error);
    throw error;
  }
}

export async function searchSourceNotes(userId: number, query: string): Promise<SourceNoteSearchResult[]> {
  try {
    const pattern = `%${query}%`;
    const results = await db
      .select({
        id: sourceNotes.id,
        originalFileName: sourceNotes.originalFileName,
        rawContent: sourceNotes.rawContent,
        importDate: sourceNotes.importDate,
        fileSize: sourceNotes.fileSize,
      })
      .from(sourceNotes)
      .where(
        and(
          eq(sourceNotes.userId, userId),
          or(
            like(sourceNotes.originalFileName, pattern),
            like(sourceNotes.rawContent, pattern)
          )
        )
      )
      .limit(MAX_RESULTS);

    return results;
  } catch (error) {
    console.error('Failed to search source notes:', error);
    throw error;
  }
}
