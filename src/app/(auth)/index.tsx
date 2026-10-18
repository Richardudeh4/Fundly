import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing } from '@/constants/theme';
import { api, ApiError, TokenStorage } from '@/RequestHandler/Request';
import { useAuthStore } from '@/store/auth';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'At least 6 characters required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    const body = {
      phone: phone.trim(),
      password,
    };
    setLoading(true);
    try {
      const response = await api.auth.login(body);
      const { user, accessToken, refreshToken } = response;
      await TokenStorage.saveTokens(accessToken, refreshToken);
      useAuthStore.getState().setAuth(user, accessToken);
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PHONE_NOT_VERIFIED') {
        // Account exists but OTP was never completed — send a fresh OTP and
        // redirect to the OTP screen in "verify-login" mode so the user can
        // verify and land directly in the app.
        try {
          await api.auth.sendOtp({ phone: phone.trim() });
        } catch {
          // If sendOtp fails we still navigate; the OTP screen has a resend button
        }
        router.push({
          pathname: '/(auth)/otp',
          params: { phone: phone.trim(), mode: 'verify-login' },
        });
      } else {
        setErrors({ phone: err instanceof ApiError ? err.message : 'Sign in failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardView>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <AppText style={styles.logoEmoji}>💙</AppText>
        </View>
        <AppText variant="displayMedium" style={styles.title}>
          Welcome back
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          Sign in to continue managing your loans
        </AppText>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <AppInput
          label="Phone number"
          placeholder="+2348012345678"
          value={phone}
          onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
          error={errors.phone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <AppInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
          error={errors.password}
          showPasswordToggle
          textContentType="password"
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          activeOpacity={0.7}
          style={styles.forgotLink}
        >
          <AppText variant="label" color={Colors.primary}>
            Forgot password?
          </AppText>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <AppButton label="Sign In" onPress={handleSignIn} loading={loading} />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <AppText variant="caption" style={styles.dividerText}>
            or
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        {/* Social placeholder */}
        <AppButton
          label="Continue with Google"
          onPress={() => {}}
          variant="outline"
          leftIcon={<AppText style={styles.socialIcon}>G</AppText>}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <AppText variant="bodySmall" color={Colors.text.secondary}>
          Don't have an account?{' '}
        </AppText>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
          <AppText variant="bodySmall" color={Colors.primary} style={styles.linkText}>
            Sign Up
          </AppText>
        </TouchableOpacity>
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: {
    fontSize: 28,
  },
  title: {
    lineHeight: 36,
  },
  subtitle: {
    marginTop: Spacing.xs / 2,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: Spacing.xs,
    color: Colors.text.muted,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  linkText: {
    fontWeight: '600',
  },
});
