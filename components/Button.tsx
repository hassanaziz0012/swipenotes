import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const Button = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? Colors.primary.base : 'transparent';
  const textColor = isPrimary ? '#fff' : Colors.primary.base;
  const borderColor = isPrimary ? 'transparent' : Colors.primary.base;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled || loading ? 0.7 : 1,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing['3.5'],
    paddingHorizontal: Spacing['6'],
    borderRadius: Spacing['2'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.base.fontSize,
    textAlign: 'center',
  },
});
