import { eq } from 'drizzle-orm';
import { db } from './client';
import { cards } from './models/card';
import { sourceNotes } from './models/sourcenote';

export async function deleteSourceNote(id: number) {
  return await db.transaction(async (tx) => {
    // Delete associated cards first
    await tx.delete(cards).where(eq(cards.sourceNoteId, id));
    // Delete the source note
    await tx.delete(sourceNotes).where(eq(sourceNotes.id, id));
  });
}
