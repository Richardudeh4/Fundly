import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthHeader } from '@/components/AuthHeader';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) { setError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return false; }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: call forgot password API
      await new Promise((r) => setTimeout(r, 1200));
      router.push({ pathname: '/(auth)/otp', params: { email } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardView>
      <AuthHeader
        title="Forgot password?"
        subtitle="No worries — we'll send you a reset code"
      />

      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationBox}>
          <AppText style={styles.illustrationEmoji}>📧</AppText>
          <AppText variant="bodySmall" align="center" color={Colors.text.secondary} style={styles.illustrationHint}>
            We'll send a 6-digit code to your email to verify your identity
          </AppText>
        </View>

        <AppInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(undefined); }}
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus
        />

        <AppButton label="Send Reset Code" onPress={handleSendOTP} loading={loading} />

        <AppButton
          label="Back to Sign In"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.backButton}
        />
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  illustrationBox: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  illustrationEmoji: {
    fontSize: 52,
    lineHeight: 60,
  },
  illustrationHint: {
    lineHeight: 22,
  },
  backButton: {
    marginTop: Spacing.sm,
  },
});
