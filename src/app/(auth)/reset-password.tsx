import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '@/components/AuthHeader';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: Colors.border, width: '0%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const score = [password.length >= 8, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: Colors.error, width: '30%' };
    if (score <= 3) return { label: 'Fair', color: Colors.warning, width: '60%' };
    return { label: 'Strong', color: Colors.success, width: '100%' };
  };

  const strength = getPasswordStrength();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'At least 8 characters required';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: call reset password API with email, otp, password
      await new Promise((r) => setTimeout(r, 1200));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardView scrollEnabled={false}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <AppText style={styles.successEmoji}>✅</AppText>
          </View>
          <AppText variant="displayMedium" align="center" style={styles.successTitle}>
            Password reset!
          </AppText>
          <AppText variant="body" align="center" color={Colors.text.secondary} style={styles.successSubtitle}>
            Your password has been changed successfully. You can now sign in with your new password.
          </AppText>
          <AppButton
            label="Back to Sign In"
            onPress={() => router.replace('/(auth)')}
            style={styles.successButton}
          />
        </View>
      </KeyboardView>
    );
  }

  return (
    <KeyboardView>
      <AuthHeader
        title="Reset password"
        subtitle="Create a new secure password for your account"
      />

      <View style={styles.content}>
        <AppInput
          label="New password"
          placeholder="Min. 8 characters"
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
          error={errors.password}
          showPasswordToggle
          textContentType="newPassword"
          autoFocus
        />

        {/* Strength meter */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
            </View>
            <AppText variant="caption" color={strength.color} style={styles.strengthLabel}>
              {strength.label}
            </AppText>
          </View>
        )}

        <AppInput
          label="Confirm new password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: undefined })); }}
          error={errors.confirmPassword}
          showPasswordToggle
          textContentType="newPassword"
        />

        {/* Requirements list */}
        <View style={styles.requirements}>
          {[
            { label: 'At least 8 characters', met: password.length >= 8 },
            { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
            { label: 'One number', met: /\d/.test(password) },
          ].map((req) => (
            <View key={req.label} style={styles.reqRow}>
              <AppText
                variant="caption"
                color={req.met ? Colors.success : Colors.text.muted}
              >
                {req.met ? '✓ ' : '○ '}{req.label}
              </AppText>
            </View>
          ))}
        </View>

        <AppButton label="Reset Password" onPress={handleReset} loading={loading} />
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    width: 48,
    fontWeight: '600',
  },
  requirements: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  reqRow: {},
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successEmoji: {
    fontSize: 52,
    lineHeight: 58,
  },
  successTitle: {},
  successSubtitle: {
    lineHeight: 26,
    textAlign: 'center',
  },
  successButton: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});
