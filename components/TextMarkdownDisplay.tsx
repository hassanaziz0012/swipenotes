import React from 'react';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

interface TextMarkdownDisplayProps {
  children: string;
  style?: MarkdownProps['style'];
}

export function TextMarkdownDisplay({ children, style }: TextMarkdownDisplayProps) {
  return (
    <Markdown style={{ ...markdownStyles, ...style }}>
      {children}
    </Markdown>
  );
}

const markdownStyles = {
  body: {
    ...Typography.sm,
    color: Colors.text.base,
    fontFamily: FontFamily.regular,
  },
  heading1: {
    ...Typography['2xl'],
    color: Colors.text.base,
    marginBottom: Spacing['2.5'],
    fontFamily: FontFamily.bold,
  },
  heading2: {
    ...Typography.xl,
    color: Colors.text.base,
    marginTop: Spacing['3'],
    marginBottom: Spacing['2.5'],
    fontFamily: FontFamily.bold,
  },
  heading3: {
    ...Typography.lg,
    color: Colors.text.base,
    marginTop: Spacing['2.5'],
    marginBottom: Spacing['2'],
    fontFamily: FontFamily.bold,
  },
  paragraph: {
    marginBottom: Spacing['3'],
    lineHeight: Typography.base.lineHeight,
  },
};
