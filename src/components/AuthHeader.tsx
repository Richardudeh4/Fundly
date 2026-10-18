import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './AppText';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  style?: ViewStyle;
}

export function AuthHeader({ title, subtitle, showBack = true, style }: AuthHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }, style]}>
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.backCircle}>
            <AppText variant="body" color={Colors.primary} style={styles.backArrow}>
              ←
            </AppText>
          </View>
        </TouchableOpacity>
      )}
      <View style={styles.titleBlock}>
        <AppText variant="displayMedium">{title}</AppText>
        {subtitle && (
          <AppText variant="body" style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    lineHeight: 22,
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
});
