# Swipe Notes - Complete Implementation Plan

## 1. Core Concept

**Purpose:** Help users rediscover forgotten notes and insights through a swipeable card interface with intelligent rotation scheduling.

**Key Principle:** Not a learning/flashcard app - it's about rediscovery and keeping ideas alive.

---

## 2. Data Architecture

### Database Schema

```javascript
// Users
{
  id: string,
  created_at: timestamp,
  settings: {
    daily_card_limit: number, // default: 20
    notification_enabled: boolean,
    notification_time: string, // "9:00 AM"
    theme: "light" | "dark" | "auto",
    swipe_sensitivity: "normal" | "easy" | "hard"
  }
}

// Projects
{
  id: string,
  user_id: string,
  name: string, // "Inbox" is default
  color: string,
  created_at: timestamp,
  is_default: boolean
}

// Source Notes (original imports)
{
  id: string,
  user_id: string,
  original_filename: string,
  import_date: timestamp,
  raw_content: string, // Original markdown
  content_hash: string, // For duplicate detection
  generated_card_count: number,
  file_size: number
}

// Cards
{
  id: string,
  user_id: string,
  source_note_id: string,
  project_id: string,
  
  content: string, // Markdown, max 150 words
  extra_info: string | null, // User-added markdown notes
  tags: string[], // Lowercase, max 10 tags
  
  // Spaced repetition tracking
  created_at: timestamp,
  last_seen: timestamp | null,
  interval_days: number, // Current interval (3,7,14,30,60,90)
  times_seen: number,
  times_left_swiped: number,
  times_right_swiped: number,
  
  // State
  in_review_queue: boolean,
  is_edited: boolean,
  
  // Metadata
  extraction_method: "chunk_header" | "chunk_paragraph" | "ai" | "full",
  word_count: number
}

// Tags (for autocomplete and management)
{
  id: string,
  user_id: string,
  name: string, // Lowercase
  usage_count: number,
  created_at: timestamp
}

// Sessions
{
  id: string,
  user_id: string,
  started_at: timestamp,
  ended_at: timestamp | null,
  is_active: boolean,
  cards_swiped: number,
  swipe_history: [
    {
      card_id: string,
      action: "left" | "right",
      timestamp: timestamp,
      source: "rotation" | "review_queue"
    }
  ]
}

// Statistics (aggregated daily)
{
  id: string,
  user_id: string,
  date: date,
  cards_swiped: number,
  cards_left_swiped: number,
  cards_right_swiped: number,
  session_count: number,
  review_queue_completed: number
}

// Local Images
{
  id: string,
  card_id: string,
  original_path: string,
  local_path: string, // file:// URI
  file_size: number
}
```

---

## 3. Rotation Algorithm

### Spaced Repetition with Randomness

```javascript
const INTERVALS = [3, 7, 14, 30, 60, 90]; // days, max 90
const RANDOMNESS_FACTOR = 0.2; // ±20%

function calculateNextShowDate(card, action) {
  if (action === "right") {
    // Add to review queue, don't change interval
    return {
      in_review_queue: true,
      times_right_swiped: card.times_right_swiped + 1
    };
  }
  
  if (action === "left") {
    // Progress to next interval
    const currentIndex = INTERVALS.indexOf(card.interval_days);
    const nextIndex = Math.min(currentIndex + 1, INTERVALS.length - 1);
    const baseInterval = INTERVALS[nextIndex];
    
    // Add randomness: ±20%
    const randomOffset = baseInterval * RANDOMNESS_FACTOR;
    const actualInterval = baseInterval + 
      (Math.random() * randomOffset * 2 - randomOffset);
    
    const nextShowDate = new Date();
    nextShowDate.setDate(nextShowDate.getDate() + Math.round(actualInterval));
    
    return {
      interval_days: INTERVALS[nextIndex],
      last_seen: new Date(),
      times_left_swiped: card.times_left_swiped + 1,
      times_seen: card.times_seen + 1,
      next_eligible_date: nextShowDate
    };
  }
}

function generateDeck(allCards, dailyLimit) {
  const today = new Date();
  
  // Get eligible cards (interval has passed)
  const eligibleCards = allCards.filter(card => 
    !card.in_review_queue &&
    (!card.last_seen || daysSince(card.last_seen) >= card.interval_days)
  );
  
  // Shuffle for randomness
  const shuffled = shuffleArray(eligibleCards);
  
  // Return up to daily limit
  return shuffled.slice(0, dailyLimit);
}
```

---

## 4. Import System

### Import Flow

```
1. User selects markdown file(s)
2. For each file:
   a. Calculate content hash
   b. Check for duplicates
   c. Analyze structure and chunk
   d. Extract/copy images locally
   e. Generate cards
3. Auto-suggest tags
4. User assigns to project (default: Inbox)
5. Store and show summary
```

### Chunking Algorithm

```javascript
function chunkNote(content, filename) {
  const wordCount = countWords(content);
  const MAX_WORDS_PER_CARD = 150;
  
  // Single card if short enough
  if (wordCount <= MAX_WORDS_PER_CARD) {
    return [{
      content: content,
      extraction_method: "full",
      word_count: wordCount
    }];
  }
  
  // Try splitting by headers
  const sections = splitByHeaders(content);
  if (sections.length > 1) {
    const cards = [];
    for (let section of sections) {
      if (countWords(section.content) <= MAX_WORDS_PER_CARD) {
        cards.push({
          content: section.content,
          extraction_method: "chunk_header",
          word_count: countWords(section.content)
        });
      } else {
        // Section too long, split by paragraphs
        const subCards = splitByParagraphs(section.content, MAX_WORDS_PER_CARD);
        cards.push(...subCards);
      }
    }
    return cards;
  }
  
  // Try splitting by paragraphs
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return combineIntoParagraphCards(paragraphs, MAX_WORDS_PER_CARD);
  }
  
  // One giant paragraph - flag for AI
  return {
    warning: "difficult_to_chunk",
    suggested_action: "ai_extraction",
    fallback_card: {
      content: content.substring(0, MAX_WORDS_PER_CARD * 5), // Truncate
      extraction_method: "full",
      word_count: wordCount
    }
  };
}

function splitByHeaders(markdown) {
  // Regex to match markdown headers
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections = [];
  let lastIndex = 0;
  let match;
  
  while ((match = headerRegex.exec(markdown)) !== null) {
    if (lastIndex !== match.index) {
      sections.push({
        content: markdown.substring(lastIndex, match.index).trim()
      });
    }
    lastIndex = match.index;
  }
  
  // Add remaining content
  if (lastIndex < markdown.length) {
    sections.push({
      content: markdown.substring(lastIndex).trim()
    });
  }
  
  return sections.filter(s => s.content.length > 0);
}

function combineIntoParagraphCards(paragraphs, maxWords) {
  const cards = [];
  let currentCard = "";
  let currentWordCount = 0;
  
  for (let para of paragraphs) {
    const paraWords = countWords(para);
    
    if (currentWordCount + paraWords <= maxWords) {
      currentCard += para + "\n\n";
      currentWordCount += paraWords;
    } else {
      if (currentCard) {
        cards.push({
          content: currentCard.trim(),
          extraction_method: "chunk_paragraph",
          word_count: currentWordCount
        });
      }
      currentCard = para + "\n\n";
      currentWordCount = paraWords;
    }
  }
  
  if (currentCard) {
    cards.push({
      content: currentCard.trim(),
      extraction_method: "chunk_paragraph",
      word_count: currentWordCount
    });
  }
  
  return cards;
}
```

### AI Extraction (Optional)

```javascript
async function extractWithAI(noteContent, existingTags) {
  const prompt = `Extract 3-7 key insights from this note as separate cards.

Requirements:
- Each card: 50-200 words
- Self-contained and understandable alone
- Preserve important details, quotes, data
- Keep markdown formatting
- Suggest relevant tags from existing list when applicable

Existing tags: ${existingTags.join(', ')}

Note content:
${noteContent}

Return JSON:
{
  "cards": [
    {
      "content": "card content in markdown",
      "suggested_tags": ["tag1", "tag2"]
    }
  ]
}`;

  const response = await callClaudeAPI(prompt);
  return JSON.parse(response);
}
```

### Tag Auto-Suggestion

```javascript
function suggestTags(noteContent, existingTags) {
  const contentLower = noteContent.toLowerCase();
  
  // Find existing tags that appear in content
  const matches = existingTags.filter(tag =>
    contentLower.includes(tag.toLowerCase())
  );
  
  // Sort by usage count (popular tags first)
  matches.sort((a, b) => b.usage_count - a.usage_count);
  
  return matches.slice(0, 5);
}
```

### Image Handling

```javascript
async function processImages(markdown, noteId) {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let updatedMarkdown = markdown;
  
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    const [fullMatch, alt, originalPath] = match;
    
    // Copy image to local storage
    const localPath = await copyImageToLocal(originalPath, noteId);
    
    if (localPath) {
      images.push({
        original_path: originalPath,
        local_path: localPath,
        alt: alt
      });
      
      // Update markdown with new local path
      updatedMarkdown = updatedMarkdown.replace(
        fullMatch,
        `![${alt}](${localPath})`
      );
    } else {
      // Image not found, remove from markdown
      updatedMarkdown = updatedMarkdown.replace(fullMatch, `[Image not found: ${alt}]`);
    }
  }
  
  return { updatedMarkdown, images };
}

async function copyImageToLocal(sourcePath, noteId) {
  try {
    const filename = path.basename(sourcePath);
    const destDir = `${FileSystem.documentDirectory}images/${noteId}/`;
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    
    const destPath = `${destDir}${filename}`;
    await FileSystem.copyAsync({ from: sourcePath, to: destPath });
    
    return destPath;
  } catch (error) {
    console.error("Failed to copy image:", error);
    return null;
  }
}
```

---

## 5. User Interface

### Main Screens

**1. Swipe Screen (Main)**
```
┌─────────────────────────────────┐
│  [History] [Stats] Session: 5   │
├─────────────────────────────────┤
│                                 │
│         [CARD CONTENT]          │
│                                 │
│  "This is the insight from      │
│   your note about..."           │
│                                 │
│  Tags: [work] [ideas]           │
│                                 │
│  ↓ Extra Info                   │
│                                 │
├─────────────────────────────────┤
│  ← Swipe left    Swipe right →  │
│    (See later)   (Review)       │
└─────────────────────────────────┘
```

**2. Review Queue**
```
┌─────────────────────────────────┐
│  ← Back    Review Queue (12)    │
├─────────────────────────────────┤
│                                 │
│         [CARD CONTENT]          │
│                                 │
│  [Edit] button                  │
│                                 │
├─────────────────────────────────┤
│  ← Swipe left    Swipe right →  │
│    (Done)        (Keep)         │
└─────────────────────────────────┘
```

**3. Session History**
```
┌─────────────────────────────────┐
│  ← Back    Session History      │
├─────────────────────────────────┤
│  Card 1: "Meeting notes..."     │
│  Action: Swiped right           │
│  [Undo]                         │
├─────────────────────────────────┤
│  Card 2: "Project idea..."      │
│  Action: Swiped left            │
│  [Undo]                         │
├─────────────────────────────────┤
│  ...                            │
└─────────────────────────────────┘
```

**4. Import Screen**
```
┌─────────────────────────────────┐
│  Import Notes                   │
├─────────────────────────────────┤
│  [Select Files]                 │
│                                 │
│  Selected:                      │
│  • meeting-notes.md (4 cards)   │
│  • ideas.md (7 cards)           │
│  • research.md ⚠️ (AI rec.)     │
│                                 │
│  Project: [Inbox ▼]             │
│  Tags: [work] [+Add]            │
│                                 │
│  [Import] [Cancel]              │
└─────────────────────────────────┘
```

**5. Statistics**
```
┌─────────────────────────────────┐
│  Statistics                     │
├─────────────────────────────────┤
│  Today: 15 cards swiped         │
│  Total: 342 cards               │
│  Streak: 7 days 🔥              │
│                                 │
│  Review Queue: 8 cards          │
│                                 │
│  By Project:                    │
│  • Work: 125 cards              │
│  • Personal: 87 cards           │
│  • Inbox: 130 cards             │
└─────────────────────────────────┘
```

**6. Settings**
```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│  Daily Card Limit: [20]         │
│  Notification Time: [9:00 AM]   │
│  Theme: [Auto ▼]                │
│  Swipe Sensitivity: [Normal ▼]  │
│                                 │
│  [Manage Projects]              │
│  [Manage Tags]                  │
│  [End Current Session]          │
└─────────────────────────────────┘
```

### Onboarding Demo Cards

```javascript
const demoCards = [
  {
    content: "# Welcome to Swipe Notes!\n\nRediscover your forgotten insights. Swipe right → to review this card later.",
    tags: ["demo"],
    extra_info: "This is where you can add extra context about any card."
  },
  {
    content: "**Swipe left ←** to see this card again in a few days.\n\nCards use spaced repetition to resurface at the right time.",
    tags: ["demo"]
  },
  {
    content: "Tap the **↓ Extra Info** button below to see additional notes you've added to a card.",
    tags: ["demo"],
    extra_info: "Like this! You can add summaries, connections, or anything else here."
  },
  {
    content: "Use the **History** button at the top to undo swipes during your current session.",
    tags: ["demo"]
  },
  {
    content: "# Ready to start?\n\nImport your notes and let Swipe Notes help you remember what matters.\n\n[Tap to Import Notes]",
    tags: ["demo"]
  }
];
```

---

## 6. Session Management

### Session Logic

```javascript
class SessionManager {
  startSession(userId) {
    const session = {
      id: generateId(),
      user_id: userId,
      started_at: new Date(),
      ended_at: null,
      is_active: true,
      cards_swiped: 0,
      swipe_history: []
    };
    
    saveSession(session);
    return session;
  }
  
  recordSwipe(sessionId, cardId, action, source) {
    const session = getSession(sessionId);
    session.swipe_history.push({
      card_id: cardId,
      action: action,
      timestamp: new Date(),
      source: source
    });
    session.cards_swiped++;
    updateSession(session);
  }
  
  undoLastSwipe(sessionId) {
    const session = getSession(sessionId);
    const lastSwipe = session.swipe_history.pop();
    
    if (lastSwipe) {
      // Revert card state
      revertCardSwipe(lastSwipe.card_id, lastSwipe.action);
      session.cards_swiped--;
      updateSession(session);
      return lastSwipe.card_id;
    }
    return null;
  }
  
  endSession(sessionId) {
    const session = getSession(sessionId);
    session.ended_at = new Date();
    session.is_active = false;
    updateSession(session);
    
    // Update daily statistics
    updateDailyStats(session);
  }
  
  checkAndStartNewSession(userId) {
    const activeSession = getActiveSession(userId);
    
    // Start new session if:
    // 1. No active session
    // 2. Active session from previous day
    if (!activeSession || !isToday(activeSession.started_at)) {
      if (activeSession) {
        this.endSession(activeSession.id);
      }
      return this.startSession(userId);
    }
    
    return activeSession;
  }
}
```

---

## 7. Tech Stack

### Mobile App (React Native + Expo)

```json
{
  "dependencies": {
    "expo": "^51.0.0",
    "react-native": "^0.74.0",
    "expo-file-system": "^17.0.0",
    "expo-document-picker": "^12.0.0",
    "react-native-markdown-display": "^7.0.0",
    "react-native-gesture-handler": "^2.16.0",
    "react-native-reanimated": "^3.10.0",
    "expo-sqlite": "^14.0.0",
    "expo-notifications": "^0.28.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.6.0"
  }
}
```

### File Structure

```
swipe-notes/
├── src/
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── SwipeCard.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── TagList.tsx
│   ├── screens/
│   │   ├── SwipeScreen.tsx
│   │   ├── ReviewQueueScreen.tsx
│   │   ├── ImportScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── database.ts
│   │   ├── import.ts
│   │   ├── rotation.ts
│   │   ├── session.ts
│   │   └── notifications.ts
│   ├── utils/
│   │   ├── markdown.ts
│   │   ├── chunking.ts
│   │   └── helpers.ts
│   ├── stores/
│   │   ├── userStore.ts
│   │   ├── cardStore.ts
│   │   └── sessionStore.ts
│   └── App.tsx
├── assets/
└── app.json
```

---

## 8. Implementation Timeline (6 Weeks)

### Week 1: Foundation
- [ ] Project setup (Expo + React Native)
- [ ] Database schema + SQLite setup
- [ ] Basic navigation structure
- [ ] Card component with markdown rendering
- [ ] Image handling in markdown

### Week 2: Core Swiping
- [ ] Swipe gesture implementation
- [ ] Session management
- [ ] History screen with undo
- [ ] Basic rotation (queue-based, no spaced repetition yet)
- [ ] Demo cards + onboarding flow

### Week 3: Import System
- [ ] File picker integration
- [ ] Markdown parsing
- [ ] Chunking algorithm (headers, paragraphs)
- [ ] Duplicate detection (content hash)
- [ ] Local image storage
- [ ] Import preview screen

### Week 4: Organization
- [ ] Projects (Inbox default)
- [ ] Tags (create, assign, manage)
- [ ] Tag auto-suggestion
- [ ] Bulk tag assignment
- [ ] Review queue screen
- [ ] Card editing functionality

### Week 5: Intelligence
- [ ] Spaced repetition algorithm
- [ ] Randomization in rotation
- [ ] Daily card limit
- [ ] Statistics tracking
- [ ] Daily notifications
- [ ] Settings screen

### Week 6: Polish & Testing
- [ ] Extra info field (markdown)
- [ ] Error handling (all edge cases)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Bug fixes

### Post-MVP (Future)
- [ ] AI extraction integration (Claude API)
- [ ] Search functionality
- [ ] Desktop app (Tauri + Rust)
- [ ] Dropbox sync
- [ ] Import from Notion/Evernote/etc.
- [ ] Export cards to markdown
- [ ] Advanced statistics

---

## 9. Key Implementation Notes

### Performance Considerations
- Lazy load cards (don't load all 5000 into memory)
- Index database on `last_seen`, `interval_days`, `in_review_queue`
- Batch image processing during import
- Use React.memo for card components
- Implement virtual scrolling for history

### Error Handling
```javascript
// Import errors
try {
  const result = await importMarkdownFile(file);
} catch (error) {
  if (error.type === "DUPLICATE") {
    showDialog("This file was already imported on " + error.date);
  } else if (error.type === "MALFORMED") {
    showDialog("Unable to parse file. Please check markdown syntax.");
  } else if (error.type === "STORAGE_FULL") {
    showDialog("Not enough storage space. Free up space and try again.");
  } else {
    showDialog("Import failed: " + error.message);
  }
}
```

### Notifications
```javascript
// Schedule daily notification
async function scheduleDailyNotification(time) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Swipe Notes",
      body: "You have cards waiting to be reviewed!",
      data: { screen: "SwipeScreen" }
    },
    trigger: {
      hour: parseInt(time.split(":")[0]),
      minute: parseInt(time.split(":")[1]),
      repeats: true
    }
  });
}
```

---

## 10. Success Metrics

Track these to measure if the app achieves its goal:

1. **Engagement:**
   - Daily active users
   - Average cards swiped per session
   - Streak length (consecutive days)

2. **Retention:**
   - 7-day retention rate
   - 30-day retention rate
   - Cards per user over time

3. **Value:**
   - Notes imported per user
   - Cards generated per note
   - Review queue usage rate

4. **Feature Usage:**
   - AI extraction adoption rate
   - Tag usage patterns
   - Project organization adoption
