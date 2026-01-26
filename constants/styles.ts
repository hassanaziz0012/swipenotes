
export const Colors = {
  primary: {
    light6: 'hsl(20, 70%, 95%)',
    light5: 'hsl(19, 70%, 90%)',
    light4: 'hsl(18, 68%, 84%)',
    light3: 'hsl(17, 66%, 78%)',
    light2: 'hsl(16, 64%, 72%)',
    light1: 'hsl(16, 64%, 66%)',
    base: 'hsl(15, 63%, 60%)',
    dark1: 'hsl(14, 64%, 54%)',
    dark2: 'hsl(13, 66%, 48%)',
    dark3: 'hsl(12, 68%, 42%)',
    dark4: 'hsl(11, 70%, 36%)',
    dark5: 'hsl(10, 75%, 28%)',
    dark6: 'hsl(9, 80%, 20%)',
  },
  background: {
      base: '#F9FAFB', // cool gray 50
      card: '#FFFFFF',
  },
  text: {
      base: '#111827', // cool gray 900
      subtle: '#6B7280', // cool gray 500
  },
  border: {
      subtle: '#E5E7EB', // cool gray 200
  }
} as const;

export const FontFamily = {
  regular: 'Inter_400Regular',
  bold: 'Inter_700Bold',
} as const;

export const Typography = {
  xs: {
    fontSize: 12,
    lineHeight: 16,
  },
  sm: {
    fontSize: 14,
    lineHeight: 20,
  },
  base: {
    fontSize: 16,
    lineHeight: 24,
  },
  lg: {
    fontSize: 18,
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
  },
  '2xl': {
    fontSize: 24,
    lineHeight: 32,
  },
  '3xl': {
    fontSize: 30,
    lineHeight: 36,
  },
  '4xl': {
    fontSize: 36,
    lineHeight: 40,
  },
  '5xl': {
    fontSize: 48,
    lineHeight: 48,
  },
  '6xl': {
    fontSize: 60,
    lineHeight: 60,
  },
  '7xl': {
    fontSize: 72,
    lineHeight: 72,
  },
  '8xl': {
    fontSize: 96,
    lineHeight: 96,
  },
  '9xl': {
    fontSize: 128,
    lineHeight: 128,
  },
  // Aliases
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const Spacing = {
  '0': 0,
  'px': 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384,
} as const;
