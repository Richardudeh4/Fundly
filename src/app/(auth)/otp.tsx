import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '@/components/AuthHeader';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { OTPInput } from '@/components/OTPInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { api, ApiError, TokenStorage } from '@/RequestHandler/Request';
import { useAuthStore } from '@/store/auth';

const OTP_RESEND_TIMEOUT = 60;

export default function OTPScreen() {
  const router = useRouter();
  const { response, email: emailParam, phone, mode } = useLocalSearchParams<{
    response: string;
    email: string;
    phone: string;
    mode?: string;
  }>();

  const isVerifyLogin = mode === 'verify-login';

  // email may come directly as a param (forgot-password flow) or nested in the response JSON (register flow)
  const email: string = emailParam ?? (() => {
    try { return JSON.parse(response ?? '{}')?.email ?? ''; } catch { return ''; }
  })();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    startCountdown();
    console.log("otp response:", JSON.stringify(response,[2]))
    return () => clearTimer();
  }, []);

  const startCountdown = () => {
    setCountdown(OTP_RESEND_TIMEOUT);
    setCanResend(false);
    clearTimer();
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      if (isVerifyLogin) {
        // Verify OTP then complete login in one step
        const result = await api.auth.verifyOtp({ phone: phone!, code: otp });
        await TokenStorage.saveTokens(result.accessToken, result.refreshToken);
        // Fetch the full user profile now that we have a valid token
        const me = await api.me();
        useAuthStore.getState().setAuth(me, result.accessToken);
        router.replace('/(tabs)');
      } else {
        // TODO: verify OTP via API (forgot-password flow)
        await new Promise((r) => setTimeout(r, 1200));
        router.replace({ pathname: '/(auth)/reset-password', params: { email, otp, phone } });
      }
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'OTP_INVALID' || err.code === 'OTP_TOO_MANY_ATTEMPTS')) {
        setError(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    if (isVerifyLogin && phone) {
      try {
        await api.auth.sendOtp({ phone });
      } catch {
        // silently ignore — the user can try again
      }
    }
    startCountdown();
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))
    : 'your email';

  return (
    <KeyboardView>
      <AuthHeader
        title={isVerifyLogin ? 'Verify your number' : 'Check your email'}
        subtitle={isVerifyLogin
          ? `We sent a 6-digit code to ${phone}`
          : `We sent a 6-digit code to ${maskedEmail}`}
      />

      <View style={styles.content}>
        {/* OTP badge */}
        <View style={styles.badge}>
          <AppText style={styles.badgeEmoji}>🔢</AppText>
        </View>

        <AppText variant="label" style={styles.otpLabel}>
          Enter verification code
        </AppText>

        <OTPInput value={otp} onChange={setOtp} error={error} />

        {error && (
          <AppText variant="caption" color={Colors.error} style={styles.errorText}>
            Invalid code. Please try again.
          </AppText>
        )}

        <View style={styles.resendRow}>
          <AppText variant="bodySmall" color={Colors.text.secondary}>
            Didn't receive a code?{' '}
          </AppText>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <AppText variant="bodySmall" color={Colors.primary} style={styles.resendLink}>
                Resend
              </AppText>
            </TouchableOpacity>
          ) : (
            <AppText variant="bodySmall" color={Colors.text.muted}>
              Resend in {countdown}s
            </AppText>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            label="Verify Code"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length < 6}
          />
        </View>
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  badgeEmoji: {
    fontSize: 36,
    lineHeight: 40,
  },
  otpLabel: {
    marginBottom: Spacing.md,
    color: Colors.text.secondary,
  },
  errorText: {
    marginTop: Spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    justifyContent: 'center',
  },
  resendLink: {
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Spacing.xs,
  },
});
