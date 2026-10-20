import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/RequestHandler/Request';
import { useAuthStore } from '@/store/auth';
import {Ionicons } from '@expo/vector-icons';

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
      // Step 1: verify password — backend sends OTP, no tokens yet
      await api.auth.login(body);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: phone.trim(), mode: 'verify-login-otp' },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PHONE_NOT_VERIFIED') {
        // Account exists but signup OTP was never completed
        try {
          await api.auth.sendOtp({ phone: phone.trim() });
        } catch {
          // OTP screen has a resend button — navigate anyway
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
          <Image 
          style={styles.logoImage}
          source={require("../../../assets/images/appstore.png")} />
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
        textStyle={{color: "gray"}}
          label="Continue with Google"
          onPress={() => {}}
          variant="outline"
          leftIcon={<Ionicons name="logo-google" size={20}/>}
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
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
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
