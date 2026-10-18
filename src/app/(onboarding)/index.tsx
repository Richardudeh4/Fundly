import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/store/onboarding';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  bg: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Fast Loans,\nEasy Access',
    subtitle: 'Get approved in minutes. No paperwork, no long queues — just instant decisions tailored for you.',
    emoji: '⚡',
    bg: '#EBF5FF',
    accentColor: Colors.primary,
  },
  {
    id: '2',
    title: 'Track Every\nRepayment',
    subtitle: 'Stay on top of your finances with real-time repayment schedules and clear payment breakdowns.',
    emoji: '📊',
    bg: '#F0FDF9',
    accentColor: Colors.accent,
  },
  {
    id: '3',
    title: 'Your Money,\nYour Control',
    subtitle: 'Secure, transparent, and built around you. Take charge of your financial future today.',
    emoji: '🔐',
    bg: '#F5F0FF',
    accentColor: '#8B5CF6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboardingStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    completeOnboarding();
    router.replace('/(auth)');
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <SlideItem slide={item} />
        )}
      />

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.md }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
                i === activeIndex && { backgroundColor: slides[activeIndex].accentColor },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {!isLast && (
            <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7} style={styles.skip}>
              <AppText variant="label" color={Colors.text.muted}>
                Skip
              </AppText>
            </TouchableOpacity>
          )}
          <View style={[styles.nextButton, isLast && styles.nextButtonFull]}>
            <AppButton
              label={isLast ? 'Get Started' : 'Next'}
              onPress={goNext}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function SlideItem({ slide }: { slide: Slide }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.slide, { width }]}>
      {/* Illustration area */}
      <View style={[styles.illustrationContainer, { backgroundColor: slide.bg, paddingTop: insets.top + Spacing.xxl }]}>
        <View style={[styles.emojiCircle, { shadowColor: slide.accentColor }]}>
          <AppText style={styles.emoji}>{slide.emoji}</AppText>
        </View>
        {/* Decorative circles */}
        <View style={[styles.decorCircle1, { backgroundColor: slide.accentColor }]} />
        <View style={[styles.decorCircle2, { backgroundColor: slide.accentColor }]} />
      </View>

      {/* Text area */}
      <View style={styles.textContainer}>
        <AppText variant="displayLarge" style={styles.title}>
          {slide.title}
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          {slide.subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    flex: 1,
  },
  illustrationContainer: {
    height: height * 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: Radius.xl + 8,
    borderBottomRightRadius: Radius.xl + 8,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 70,
  },
  decorCircle1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.12,
    top: '15%',
    left: '8%',
  },
  decorCircle2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.1,
    bottom: '12%',
    right: '10%',
  },
  textContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    lineHeight: 42,
  },
  subtitle: {
    lineHeight: 26,
    marginTop: Spacing.xs,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    minHeight: 52,
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
  },
  nextButtonFull: {
    flex: 1,
  },
});
