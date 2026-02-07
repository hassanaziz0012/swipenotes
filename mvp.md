# Bare Minimum MVP

**Core Features Only:**

1. **Single Screen - Swipe Interface**
   - Display one card at a time
   - Swipe left → see in 3 days
   - Swipe right → add to review queue
   - No undo, no history

2. **Manual Card Creation**
   - Simple form: text input (markdown) + optional tags
   - Max 150 words
   - No import, no chunking, no AI

3. **Basic Data Storage**
   - SQLite with 3 tables: `cards`, `users`, `sessions`
   - Fields: `id`, `content`, `tags`, `last_seen`, `interval_days`, `in_review_queue`
   - Hardcoded intervals: [3, 7, 14, 30]

4. **Simple Rotation**
   - Show cards where `days_since(last_seen) >= interval_days`
   - Limit 20 cards/day
   - Random shuffle

5. **Review Queue**
   - Separate screen
   - Swipe left → remove from queue
   - Swipe right → keep in queue

**What to Skip:**
- Import system
- Projects/organization
- Statistics
- Images
- Extra info field
- Session management
- Notifications
- Settings
- AI features
- Undo functionality

**Tech Stack:**
- React Native + Expo
- expo-sqlite
- react-native-gesture-handler
- react-native-markdown-display

**Timeline:** 1-2 weeks max