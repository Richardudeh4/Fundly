import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';

export default function RootLayout() {
  const { token, isLoading: authLoading } = useAuthStore();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboardingStore();

  const segments = useSegments();
  const router = useRouter();

  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inAuthGroup = segments[0] === '(auth)';

    if (!hasSeenOnboarding && !inOnboarding) {
      router.replace('/(onboarding)');
      return;
    }

    if (hasSeenOnboarding && !token && !inAuthGroup) {
      router.replace('/(auth)');
      return;
    }

    if (hasSeenOnboarding && token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments, hasSeenOnboarding]);

  if (isLoading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
