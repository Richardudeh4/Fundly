import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

type Variant =
  | 'displayLarge'
  | 'displayMedium'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function AppText({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[styles[variant], { color: color ?? styles[variant].color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  displayLarge: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 30,
  },
  subheading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: 26,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.text.muted,
    lineHeight: 16,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    lineHeight: 20,
  },
});
