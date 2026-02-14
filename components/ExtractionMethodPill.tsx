import React from 'react';
import { ExtractionMethod } from '../utils/extraction';
import { Pill } from './Pill';

interface ExtractionMethodPillProps {
  method: ExtractionMethod;
}

const methodStyles: Record<ExtractionMethod, { backgroundColor: string; label: string }> = {
  chunk_paragraph: { backgroundColor: 'hsl(210, 70%, 55%)', label: 'Paragraph' },
  chunk_header: { backgroundColor: 'hsl(140, 60%, 45%)', label: 'Header' },
  ai: { backgroundColor: 'hsl(270, 60%, 55%)', label: 'AI' },
  full: { backgroundColor: 'hsl(30, 70%, 55%)', label: 'Full' },
};

export function ExtractionMethodPill({ method }: ExtractionMethodPillProps) {
  const { backgroundColor, label } = methodStyles[method] || methodStyles.full;

  return (
    <Pill 
      text={label}
      backgroundColor={backgroundColor}
      textColor="#fff"
    />
  );
}
