# Swipe Notes Design System
**Version 2.0 | React Native (iOS & Android)**

---

## Brand Foundation

### Values & Personality
- **Rediscovery over retention** - Help users reconnect with forgotten insights
- **Delight in simplicity** - Make reviewing notes joyful
- **Warm & encouraging** - Celebrate progress, support growth
- **Frictionless flow** - Never interrupt the user's rhythm

### Voice & Tone
- **Onboarding:** "Welcome! Let's rediscover what you've forgotten."
- **Empty states:** "No cards today. Time to import some notes!"
- **Achievements:** "7 day streak! 🔥" (emoji only, subtle)
- **Errors:** "Couldn't import that file. Try checking the format?"

---

## Color System

### Primary (Coral/Orange)
```typescript
primary: {
  light6: 'hsl(20, 70%, 95%)',  // Backgrounds
  light5: 'hsl(19, 70%, 90%)',  
  light4: 'hsl(18, 68%, 84%)',  
  light3: 'hsl(17, 66%, 78%)',  
  light2: 'hsl(16, 64%, 72%)',  
  light1: 'hsl(16, 64%, 66%)',  
  base:   'hsl(15, 63%, 60%)',  // Primary actions, links
  dark1:  'hsl(14, 64%, 54%)',  
  dark2:  'hsl(13, 66%, 48%)',  
  dark3:  'hsl(12, 68%, 42%)',  
  dark4:  'hsl(11, 70%, 36%)',  
  dark5:  'hsl(10, 75%, 28%)',  
  dark6:  'hsl(9, 80%, 20%)',   
}
```

### Accent (Pink)
```typescript
accent: {
  light:   '#FF6B9D',
  base:    '#FF4785',  // Highlights, celebrations
  dark:    '#E6326E',
}
```

### Semantic Colors
```typescript
success: '#10B981',  // Left swipe (See Later)
warning: '#F59E0B',  // Review queue badge
error:   '#EF4444',  // Destructive actions
info:    '#3B82F6',  // Hints, tips
```

### Neutrals (Light Mode)
```typescript
bg: {
  primary:   '#FFFFFF',  // Main background
  secondary: '#F9FAFB',  // Cards, elevated surfaces
  tertiary:  '#F3F4F6',  // Subtle sections
  elevated:  '#FFFFFF',  // Modals + shadow
}

text: {
  primary:   '#111827',  // Headings
  secondary: '#6B7280',  // Body text
  tertiary:  '#9CA3AF',  // Hints, placeholders
  disabled:  '#D1D5DB',
}

border: {
  light:  '#F3F4F6',
  medium: '#E5E7EB',
  dark:   '#D1D5DB',
}
```

### Neutrals (Dark Mode)
```typescript
bg: {
  primary:   '#0F1419',
  secondary: '#1A1F25',
  tertiary:  '#252B33',
  elevated:  '#1F2530',
}

text: {
  primary:   '#F9FAFB',
  secondary: '#D1D5DB',
  tertiary:  '#9CA3AF',
  disabled:  '#4B5563',
}

border: {
  light:  '#1F2530',
  medium: '#374151',
  dark:   '#4B5563',
}
```

### Usage Rules
- **Primary coral:** Primary buttons, active states, swipe indicators, progress
- **Accent pink:** Tags (selected), streaks, highlights, celebratory moments
- **Never use both in the same component** (creates visual confusion)
- **Dark mode:** Add subtle rim light: `inset 0 1px 0 rgba(255,255,255,0.05)`

---

## Typography

### Font Family
```typescript
primary: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI'
monospace: 'SF Mono', 'Fira Code'  // Code blocks only
```

### Type Scale
```typescript
displayLarge: { size: 40, line: 48, weight: 700, tracking: -0.5 }
display:      { size: 32, line: 40, weight: 700, tracking: -0.3 }
heading1:     { size: 28, line: 36, weight: 600, tracking: -0.2 }
heading2:     { size: 24, line: 32, weight: 600, tracking: -0.2 }
heading3:     { size: 20, line: 28, weight: 600, tracking: -0.1 }
bodyLarge:    { size: 18, line: 28, weight: 400, tracking: 0 }    // Card content
body:         { size: 16, line: 24, weight: 400, tracking: 0 }    // Default
bodySmall:    { size: 14, line: 20, weight: 400, tracking: 0 }
caption:      { size: 12, line: 16, weight: 500, tracking: 0.3 }
label:        { size: 11, line: 16, weight: 600, tracking: 0.5 }  // UPPERCASE
```

### Component Mapping
- Screen titles → Heading 1
- Card content → Body Large (18px) **← Most important**
- Buttons → Body (16px, 600 weight)
- Navigation → Body Small
- Tags → Label (uppercase)
- Metadata → Caption

---

## Spacing System

### Base: 4px Grid
```typescript
spacing = {
  xs:  4,   sm:  8,   md: 12,
  lg:  16,  xl: 20,   xxl: 24,
  xxxl: 32, xxxxl: 40, xxxxxl: 48,
}
```

### Key Measurements
```typescript
card: {
  padding: 24,          // All sides
  margin: 20,           // Screen edges
  borderRadius: 20,
}

button: {
  paddingV: 16,
  paddingH: 24,
  height: 48,
  borderRadius: 12,
}

screen: {
  marginH: 20,          // Horizontal
  marginTop: 16,
}

navigation: {
  height: 56,           // Top bar
  tabBar: 72,           // Bottom (includes safe area)
}

spacing: {
  listItem: 16,         // Between items
  section: 32,          // Between sections
  tag: 8,               // Between tags
  iconText: 8,          // Icon + text gap
}
```

---

## Border Radius & Shadows

### Border Radius
```typescript
sm:   4,   md:  8,   lg:  12,
xl:   16,  xxl: 20,  full: 9999
```

### Shadows
```typescript
subtle:    { offset: [0, 2],  opacity: 0.04, radius: 8,  blur: 0 }
raised:    { offset: [0, 4],  opacity: 0.08, radius: 16, blur: 0 }
elevated:  { offset: [0, 8],  opacity: 0.12, radius: 24, blur: 0 }  // Cards
floating:  { offset: [0, 12], opacity: 0.16, radius: 32, blur: 0 }  // Modals
maximum:   { offset: [0, 20], opacity: 0.20, radius: 48, blur: 0 }  // Dragging

// React Native implementation
shadowColor: '#000',
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.12,
shadowRadius: 24,
elevation: 8,  // Android
```

---

## Core Components

### Swipe Card
```typescript
container: {
  width: screenWidth - 40,
  padding: 24,
  borderRadius: 20,
  backgroundColor: bg.secondary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 8,
}

content: {
  fontSize: 18,         // Body Large
  lineHeight: 28,
  color: text.secondary,
}

tags: {
  marginTop: 20,
  gap: 8,
}

extraInfo: {
  marginTop: 16,
  fontSize: 14,
  color: text.tertiary,
}
```

### Buttons
```typescript
primary: {
  height: 48,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  backgroundColor: primary.base,
  // Shadow: raised
}

secondary: {
  height: 48,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  backgroundColor: bg.secondary,
  borderWidth: 1,
  borderColor: border.medium,
}

text: {
  fontSize: 16,
  fontWeight: '600',
  color: primary.base,
  paddingVertical: 8,
  paddingHorizontal: 16,
}

icon: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
}
```

### Tag Chip
```typescript
container: {
  height: 28,
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 14,
  backgroundColor: bg.tertiary,
}

selected: {
  backgroundColor: accent.light + '20',  // 20% opacity
  borderWidth: 1,
  borderColor: accent.base,
}

text: {
  fontSize: 11,
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}
```

### Navigation Bar
```typescript
topBar: {
  height: 56,
  paddingHorizontal: 20,
  backgroundColor: bg.primary,
  borderBottomWidth: 1,
  borderBottomColor: border.light,
}

bottomTabBar: {
  height: 72,  // Includes safe area
  backgroundColor: bg.elevated,
  borderTopWidth: 1,
  borderTopColor: border.light,
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
}
```

---

## Animation & Motion

### Timing Functions
```typescript
easeOut:   [0.0, 0.0, 0.2, 1]     // Deceleration
easeIn:    [0.4, 0.0, 1, 1]       // Acceleration
easeInOut: [0.4, 0.0, 0.2, 1]     // Standard
spring:    { tension: 200, friction: 20 }  // Bouncy, natural
```

### Durations
```typescript
instant:   0,      // State changes
fast:      150,    // Micro-interactions
normal:    300,    // Standard (default)
slow:      500,    // Significant changes
dramatic:  800,    // Special moments
```

### Card Swipe Animation
```typescript
// During drag (instant, follows finger)
{
  transform: [
    { translateX: gestureX },
    { rotate: `${gestureX * 0.1}deg` }
  ],
  opacity: 1 - Math.abs(gestureX) / 400
}

// Snap back (if < threshold)
{
  type: 'spring',
  tension: 200,
  friction: 20,
  transform: [
    { translateX: 0 },
    { rotate: '0deg' }
  ],
  opacity: 1
}

// Exit swipe (if >= threshold)
{
  type: 'timing',
  duration: 300,
  easing: Easing.out(Easing.ease),
  transform: [
    { translateX: direction * screenWidth },
    { rotate: `${direction * 15}deg` }
  ],
  opacity: 0
}

// Swipe feedback (green = left, amber = right)
leftSwipe: {
  shadowColor: '#10B981',
  shadowOpacity: 0.4,
  shadowRadius: 32,
}

rightSwipe: {
  shadowColor: '#F59E0B',
  shadowOpacity: 0.4,
  shadowRadius: 32,
}
```

### Card Entry
```typescript
{
  type: 'spring',
  delay: 100,
  tension: 180,
  friction: 22,
  from: {
    scale: 0.9,
    opacity: 0,
    translateY: 40
  },
  to: {
    scale: 1,
    opacity: 1,
    translateY: 0
  }
}
```

### Button Press
```typescript
{
  type: 'timing',
  duration: 150,
  easing: Easing.out(Easing.ease),
  transform: [{ scale: 0.96 }]
}
// Release: spring back to scale 1
```

### Gesture Parameters
```typescript
panGesture: {
  minDistance: 10,           // Start tracking
  minVelocity: 500,          // Trigger swipe
  threshold: 120,            // Distance to trigger
  failOffsetY: 40,           // Cancel if too vertical
  activeOffsetX: [-10, 10]   // Horizontal zone
}

spring: {
  tension: 200,   // Stiffness
  friction: 20,   // Resistance
  mass: 1,        // Weight
}
```

---

## Accessibility

### Touch Targets
```
Minimum:  44px × 44px (iOS HIG)
Recommended: 48px × 48px
Spacing: 8px minimum between
```

### Screen Readers
```typescript
// Swipe card
accessibilityLabel="Note card: {card.content.slice(0, 100)}"
accessibilityHint="Swipe left to see later, right to review"
accessibilityRole="button"

// Tag
accessibilityLabel="Tag: {tag.name}"
accessibilityState={{ selected: isSelected }}

// Button
accessibilityLabel="{action} card"
accessibilityRole="button"
```

### Color Contrast
- Large text (18px+): 3:1 minimum
- Normal text (<18px): 4.5:1 minimum
- Interactive elements: 3:1 against background
- Never rely on color alone (use icons + color)

### Reduced Motion
```typescript
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  animation.duration = 0;
  // Keep opacity, remove transforms
}
```

---

## React Native Implementation

### Design Tokens
```typescript
// tokens.ts
export const colors = {
  primary: {
    light6: 'hsl(20, 70%, 95%)',
    // ... full scale
    base: 'hsl(15, 63%, 60%)',
  },
  accent: {
    base: '#FF4785',
  },
  bg: { /* ... */ },
  text: { /* ... */ },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16,
  xl: 20, xxl: 24, xxxl: 32,
};

export const typography = {
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  // ...
};

export const shadows = {
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  // ...
};
```

---

## Quality Checklist

Before shipping:

**Visual:**
- [ ] Touch targets ≥ 48px
- [ ] Contrast ≥ 4.5:1 (text), 3:1 (UI)
- [ ] 4px grid spacing
- [ ] Safe area insets (top/bottom)
- [ ] Border radius matches type

**Interactions:**
- [ ] Button press feels responsive (150ms)
- [ ] Loading states for async
- [ ] Error states handle failures
- [ ] Empty states are helpful
- [ ] 60fps animations

**Accessibility:**
- [ ] Screen reader labels
- [ ] Focus indicators visible
- [ ] Reduced motion respected
- [ ] Color not sole indicator

---

**Version:** 2.0  
**Last Updated:** February 2026