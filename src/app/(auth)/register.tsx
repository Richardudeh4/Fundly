import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthHeader } from '@/components/AuthHeader';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { KeyboardView } from '@/components/KeyboardView';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/RequestHandler/Request';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const setField = (field: keyof FormData) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (form.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Enter a valid phone number';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'At least 8 characters required';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (!agreedToTerms) {
      setErrors((e) => ({ ...e }));
      return;
    }
    setLoading(true);
    try {
     const response = await api.auth.signup(form);
     router.replace({
      pathname:"/(auth)/otp", 
      params: {
       response: JSON.stringify(response,[2])
      }
     })
     console.log("response from the Registration:", JSON.stringify(response,[2]));
      await new Promise((r) => setTimeout(r, 1200));
    }
    catch(error: any){
       console.log("response error from the Registration:", JSON.stringify(error?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardView>
      <AuthHeader
        title="Create account"
        subtitle="Start your journey to smarter borrowing"
      />

      <View style={styles.form}>
        <AppInput
          label="Full name"
          placeholder="John Doe"
          value={form.fullName}
          onChangeText={setField('fullName')}
          error={errors.fullName}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />

        <AppInput
          label="Email address"
          placeholder="you@example.com"
          value={form.email}
          onChangeText={setField('email')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <AppInput
          label="Phone number"
          placeholder="+1 (555) 000-0000"
          value={form.phone}
          onChangeText={setField('phone')}
          error={errors.phone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
        />

        <AppInput
          label="Password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChangeText={setField('password')}
          error={errors.password}
          showPasswordToggle
          textContentType="newPassword"
          hint="Use letters, numbers and symbols for a stronger password"
        />

        <AppInput
          label="Confirm password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChangeText={setField('confirmPassword')}
          error={errors.confirmPassword}
          showPasswordToggle
          textContentType="newPassword"
        />

        {/* Terms checkbox */}
        <TouchableOpacity
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          style={styles.termsRow}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
            {agreedToTerms && (
              <AppText style={styles.checkmark}>✓</AppText>
            )}
          </View>
          <View style={styles.termsText}>
            <AppText variant="bodySmall" color={Colors.text.secondary}>
              I agree to the{' '}
            </AppText>
            <TouchableOpacity activeOpacity={0.7}>
              <AppText variant="bodySmall" color={Colors.primary} style={styles.link}>
                Terms of Service
              </AppText>
            </TouchableOpacity>
            <AppText variant="bodySmall" color={Colors.text.secondary}>
              {' '}and{' '}
            </AppText>
            <TouchableOpacity activeOpacity={0.7}>
              <AppText variant="bodySmall" color={Colors.primary} style={styles.link}>
                Privacy Policy
              </AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <AppButton
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={!agreedToTerms}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <AppText variant="bodySmall" color={Colors.text.secondary}>
          Already have an account?{' '}
        </AppText>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <AppText variant="bodySmall" color={Colors.primary} style={styles.link}>
            Sign In
          </AppText>
        </TouchableOpacity>
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: Spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: '700',
    lineHeight: 14,
  },
  termsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  link: {
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});
