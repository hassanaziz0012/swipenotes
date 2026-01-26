import { db } from "../db/client";
import { queryEligibleCards } from "./cardQueries";

export async function retrieve_eligible_cards(userId: number) {
    return queryEligibleCards(userId, db);
}
