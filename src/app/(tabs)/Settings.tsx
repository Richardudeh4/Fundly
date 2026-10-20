import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@expo/ui/community/bottom-sheet';

import { AppText } from '@/components/AppText';
import { Colors, Spacing, Radius, FontWeight } from '@/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
}

interface EditProfileSheetProps {
  initialValues: ProfileFormValues;
  /** Throw (or reject) to keep the sheet open and show an error alert. */
  onSave: (values: ProfileFormValues) => Promise<void>;
}

type Errors = Partial<Record<'firstName' | 'lastName' | 'email', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_SIZE = 96;

// ── Validation ────────────────────────────────────────────────────────────────
function validate(v: ProfileFormValues): Errors {
  const errors: Errors = {};
  if (!v.firstName.trim()) errors.firstName = 'Enter your first name';
  if (!v.lastName.trim()) errors.lastName = 'Enter your last name';
  if (!v.email.trim()) errors.email = 'Enter your email address';
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Enter a valid email address';
  return errors;
}

// ── Field ─────────────────────────────────────────────────────────────────────
interface FieldProps
  extends Omit<React.ComponentProps<typeof BottomSheetTextInput>, 'style'> {
  label: string;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
}

function Field({ label, error, inputRef, onFocus, onBlur, ...inputProps }: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
      ? Colors.primary
      : Colors.border;

  return (
    <View style={styles.field}>
      <AppText variant="label" color={Colors.text.primary}>
        {label}
      </AppText>
      <BottomSheetTextInput
        ref={inputRef as any}
        style={[
          styles.input,
          { borderColor, backgroundColor: focused ? Colors.background : Colors.surface },
        ]}
        placeholderTextColor={Colors.text.muted}
        selectionColor={Colors.primary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...inputProps}
      />
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <AppText variant="caption" color={Colors.error}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

// ── Photo picker ──────────────────────────────────────────────────────────────
function PhotoPicker({
  uri,
  initials,
  onChange,
}: {
  uri: string | null;
  initials: string;
  onChange: (uri: string | null) => void;
}) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.photoSection}>
      <Pressable
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        style={styles.avatarWrap}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarImage, styles.avatarFallback]}>
            <AppText variant="heading" color={Colors.primary}>
              {initials || '?'}
            </AppText>
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={16} color={Colors.text.inverse} />
        </View>
      </Pressable>

      <View style={styles.photoActions}>
        <Pressable onPress={pick} hitSlop={8}>
          <AppText
            variant="label"
            color={Colors.primary}
            style={{ fontWeight: FontWeight.semibold }}
          >
            {uri ? 'Change photo' : 'Add photo'}
          </AppText>
        </Pressable>
        {uri ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <AppText variant="label" color={Colors.text.muted}>
              Remove
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────
const EditProfileSheet = forwardRef<BottomSheet, EditProfileSheetProps>(
  ({ initialValues, onSave }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['88%'], []);

    const [values, setValues] = useState<ProfileFormValues>(initialValues);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);

    const errors = submitted ? validate(values) : {};

    const isDirty =
      values.firstName.trim() !== initialValues.firstName ||
      values.lastName.trim() !== initialValues.lastName ||
      values.email.trim() !== initialValues.email ||
      values.profileImage !== initialValues.profileImage;

    const set = <K extends keyof ProfileFormValues>(key: K) =>
      (value: ProfileFormValues[K]) =>
        setValues((prev) => ({ ...prev, [key]: value }));

    const initials =
      `${values.firstName.trim()[0] ?? ''}${values.lastName.trim()[0] ?? ''}`.toUpperCase();

    // Reset the form each time the sheet opens.
    const handleChange = useCallback(
      (index: number) => {
        if (index >= 0) {
          setValues(initialValues);
          setSubmitted(false);
        }
      },
      [initialValues],
    );

    const close = () => (ref as React.RefObject<BottomSheet>)?.current?.close();

    const handleSave = async () => {
      setSubmitted(true);
      if (Object.keys(validate(values)).length > 0) return;

      setSaving(true);
      try {
        await onSave({
          ...values,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
        });
        close();
      } catch (err) {
        Alert.alert(
          "Couldn't save changes",
          err instanceof Error ? err.message : 'Check your connection and try again.',
        );
      } finally {
        setSaving(false);
      }
    };

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{ backgroundColor: Colors.background }}
        handleIndicatorStyle={{ backgroundColor: Colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="subheading">Edit profile</AppText>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </Pressable>
          </View>

          {/* Form */}
          <BottomSheetScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <PhotoPicker
              uri={values.profileImage}
              initials={initials}
              onChange={set('profileImage')}
            />

            <Field
              label="First name"
              value={values.firstName}
              onChangeText={set('firstName')}
              error={errors.firstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              label="Last name"
              inputRef={lastNameRef}
              value={values.lastName}
              onChangeText={set('lastName')}
              error={errors.lastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              label="Email address"
              inputRef={emailRef}
              value={values.email}
              onChangeText={set('email')}
              error={errors.email}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </BottomSheetScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Pressable
              onPress={handleSave}
              disabled={!isDirty || saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isDirty || saving, busy: saving }}
              style={({ pressed }) => [
                styles.saveBtn,
                (!isDirty || saving) && styles.saveBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <AppText
                  variant="label"
                  color={Colors.text.inverse}
                  style={{ fontWeight: FontWeight.semibold }}
                >
                  Save changes
                </AppText>
              )}
            </Pressable>

            <Pressable onPress={close} disabled={saving} style={styles.cancelBtn}>
              <AppText variant="label" color={Colors.text.muted}>
                Cancel
              </AppText>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

EditProfileSheet.displayName = 'EditProfileSheet';
export default EditProfileSheet;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sheet: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Photo
  photoSection: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  avatarWrap: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', gap: Spacing.lg },

  // Fields
  field: { gap: Spacing.xs },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.text.primary,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  cancelBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
// import React, { useRef, useState } from 'react';
// import {
//   View,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Switch,
//   Alert,
//   Text,
//   useColorScheme,
//   TextInput,
//   Dimensions,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { AppText } from '@/components/AppText';
// import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
// import { useAuthStore } from '@/store/auth';
// import { api, TokenStorage } from '@/RequestHandler/Request';
// import { Ionicons } from '@expo/vector-icons';
// import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet';

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface SettingRowProps {
//   icon: React.ComponentProps<typeof Ionicons>['name'];
//   label: string;
//   sublabel?: string;
//   onPress?: () => void;
//   right?: React.ReactNode;
//   destructive?: boolean;
// }

// // ── Components ────────────────────────────────────────────────────────────────
// function SectionHeader({ title }: { title: string }) {
//   return (
//     <AppText
//       variant="caption"
//       color={Colors.text.muted}
//       style={styles.sectionHeader}
//     >
//       {title.toUpperCase()}
//     </AppText>
//   );
// }

// function SettingRow({ icon, label, sublabel, onPress, right, destructive }: SettingRowProps) {
  
//    return (
//     <TouchableOpacity
//       style={styles.row}
//       onPress={onPress}
//       activeOpacity={onPress ? 0.7 : 1}
//       disabled={!onPress}
//     >
//       <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
//         <Ionicons
//           name={icon}
//           size={20}
//           color={destructive ? Colors.error : Colors.text.primary}
//         />
//       </View>
//       <View style={{ flex: 1 }}>
//         <AppText
//           variant="label"
//           color={destructive ? Colors.error : Colors.text.primary}
//         >
//           {label}
//         </AppText>
//         {sublabel ? (
//           <AppText variant="caption" color={Colors.text.muted}>{sublabel}</AppText>
//         ) : null}
//       </View>
//       {right ?? (
//         onPress ? (
//           <AppText style={styles.chevron} color={Colors.text.muted}>›</AppText>
//         ) : null
//       )}
//     </TouchableOpacity>
//   );
// }

// function SettingGroup({ children }: { children: React.ReactNode }) {
//   return <View style={styles.group}>{children}</View>;
// }

// // ── Avatar initials ───────────────────────────────────────────────────────────
// function Avatar({ name, phone, edit }: { name?: string; phone?: string, edit?: boolean }) {
//   return (
//     <View style={styles.avatar}>
//       {
//     edit && (
//       <View style={{position: "relative", top: 12, left: 17}}>
//         <Ionicons name="pencil-outline" size={24}/>
//       </View>
//         )
//       }
    
//     </View>
//   );
// }

// const {width} = Dimensions.get("window")
// // ── Screen ────────────────────────────────────────────────────────────────────
// export default function SettingsScreen() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const colorScheme = useColorScheme();
//   const { user, logout } = useAuthStore();
//   const [notifications, setNotifications] = useState(true);
//   const [biometrics, setBiometrics] = useState(false);
//   const [loggingOut, setLoggingOut] = useState(false);
//   const [firstName, setFirstName] = useState<string>("");
//   const displayName = user?.firstName
//     ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
//     : undefined;
//   const displayPhone = user?.phone ?? '';
//   const displayEmail = user?.email;
//   const profileImage = user?.profileImage;
// const sheetRef = useRef<BottomSheet>(null);
// const ink = { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' };
//   const handleLogout = () => {
//     Alert.alert(
//       'Sign out',
//       'Are you sure you want to sign out?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Sign out',
//           style: 'destructive',
//           onPress: async () => {
//             if (loggingOut) return;
//             setLoggingOut(true);
//             try {
//               const refreshToken = await TokenStorage.getRefreshToken();
//               if (refreshToken) {
//                 await api.auth.logout({ refreshToken }).catch(() => {});
//               }
//             } finally {
//               await TokenStorage.clearTokens();
//               logout();
//               router.replace('/(auth)');
//             }
//           },
//         },
//       ],
//     );
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
//       showsVerticalScrollIndicator={false}
//     >
//       {/* Header */}
//       <View style={[styles.screenHeader, { paddingTop: insets.top + Spacing.lg }]}>
//         <AppText variant="heading">Settings</AppText>
//       </View>

//       {/* Profile card */}
//       <View style={[styles.profileCard, { marginHorizontal: Spacing.lg }]}>
//         <Avatar 
//         edit={true}
//         name={displayName}
//         phone={displayPhone} 
//         imageUri={{}} />
//         <View style={{ flex: 1, marginLeft: Spacing.md }}>
//           <AppText variant="subheading">
//             {displayName}
//           </AppText>
//           <AppText variant="caption" color={Colors.text.muted}>
//             {displayPhone}
//           </AppText>
//           {displayEmail ? (
//             <AppText variant="caption" color={Colors.text.muted}>
//               {displayEmail}
//             </AppText>
//           ) : null}
//         </View>
//         <TouchableOpacity
//           style={styles.editBtn}
//          onPress={() => sheetRef.current?.snapToIndex(0)} 
//           activeOpacity={0.7}
//         >
//           <AppText variant="caption" color={Colors.primary} style={{ fontWeight: FontWeight.semibold }}>
//             Edit
//           </AppText>

//       <BottomSheet
//         ref={sheetRef}
//         snapPoints={['25%', '50%', '90%']}
//         index={-1}
//         onChange={index => {
//           console.log('onChange', index);
//         }}
//         onClose={() => {
//           console.log('closed');
//         }}
//         enablePanDownToClose>
//         <BottomSheetView style={{ flex: 1, padding: 24, alignItems: 'center' }}>
//           <Text style={ink}>Edit profile</Text>

//           <View style={{display: "flex", flexDirection: "column", gap:4, paddingHorizontal: 4}}>
//            <TextInput 
//            style={{width: width * 12/100, borderColor: "gray", borderWidth:1, borderRadius:12}}
//            placeholder='Enter first name' value={firstName} onChange={(e:any) => setFirstName(e.target.value)}/>
//           </View>
//         </BottomSheetView>
//         </BottomSheet>
//         </TouchableOpacity>
//       </View>

//       {/* Verification status */}
//       {user && user.identityStatus !== 'VERIFIED' && (
//         <TouchableOpacity
//           style={[styles.verifyBanner, { marginHorizontal: Spacing.lg }]}
//           activeOpacity={0.8}
//           onPress={() => {}}
//         >
//          <Ionicons name="shield-checkmark-outline" size={30}/>
//           <View style={{ flex: 1, marginLeft: Spacing.sm }}>
//             <AppText variant="label">Verify your identity</AppText>
//             <AppText variant="caption" color={Colors.text.muted}>
//               Unlock higher loan limits
//             </AppText>
//           </View>
//           <AppText style={styles.chevron} color={Colors.primary}>›</AppText>
//         </TouchableOpacity>
//       )}

//       <View style={{ paddingHorizontal: Spacing.lg }}>
//         {/* Account */}
//         <SectionHeader title="Account" />
//         <SettingGroup>
//           <SettingRow
//             icon="person-outline" 
//             label="Personal information"
//             sublabel="Name, phone, email"
//             onPress={() => {}}
//           />
//           <SettingRow
//             icon="lock-closed-outline"
//             label="Change password"
//             onPress={() => router.push('/(auth)/forgot-password')}
//           />
//           <SettingRow
//             icon="scan-outline"
//             label="Identity verification"
//             sublabel={
//               (user as { identityStatus?: string })?.identityStatus === 'VERIFIED'
//                 ? 'Verified ✓'
//                 : 'Not verified'
//             }
//             onPress={() => {}}
//           />
//         </SettingGroup>

//         {/* Preferences */}
//         <SectionHeader title="Preferences" />
//         <SettingGroup>
//           <SettingRow
//             icon="notifications-outline"
//             label="Push notifications"
//             sublabel="Loan updates and reminders"
//             right={
//               <Switch
//                 value={notifications}
//                 onValueChange={setNotifications}
//                 trackColor={{ false: Colors.border, true: Colors.primary }}
//                 thumbColor={Colors.background}
//               />
//             }
//           />
//           <SettingRow
//             icon="finger-print-outline"
//             label="Biometric login"
//             sublabel="Use Face ID or fingerprint"
//             right={
//               <Switch
//                 value={biometrics}
//                 onValueChange={setBiometrics}
//                 trackColor={{ false: Colors.border, true: Colors.primary }}
//                 thumbColor={Colors.background}
//               />
//             }
//           />
//         </SettingGroup>

//         {/* Support */}
//         <SectionHeader title="Support" />
//         <SettingGroup>
//           <SettingRow icon="help-circle-outline" label="Help centre" onPress={() => {}} />
//           <SettingRow icon="chatbubble-ellipses-outline" label="Contact support" onPress={() => {}} />
//           <SettingRow icon="star-outline" label="Rate the app" onPress={() => {}} />
//         </SettingGroup>

//         {/* Legal */}
//         <SectionHeader title="Legal" />
//         <SettingGroup>
//           <SettingRow icon="document-text-outline" label="Terms of service" onPress={() => {}} />
//           <SettingRow icon="lock-closed-outline" label="Privacy policy" onPress={() => {}} />
//         </SettingGroup>

//         {/* Version */}
//         <View style={styles.versionRow}>
//           <AppText variant="caption" color={Colors.text.muted} align="center">
//             Fundly v1.0.0
//           </AppText>
//         </View>

//         {/* Sign out */}
//         <SettingGroup>
//           <SettingRow
//             icon="log-out-outline"
//             label="Sign out"
//             onPress={handleLogout}
//             destructive
//           />
//         </SettingGroup>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.surface },
//   screenHeader: {
//     paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
//     backgroundColor: Colors.background,
//   },

//   // Profile
//   profileCard: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: Colors.background, borderRadius: Radius.lg,
//     padding: Spacing.md, marginTop: Spacing.lg,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
//   },
//   avatar: {
//     width: 52, height: 52, borderRadius: 26,
//     backgroundColor:"red",
//     alignItems: 'center', justifyContent: 'center',
//     position: "relative"
//   },
//   avatarText: {
//     fontSize: FontSize.lg, fontWeight: FontWeight.bold,
//     color: Colors.text.inverse,
//   },
//   editBtn: {
//     paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
//     borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
//   },

//   // Verify banner
//   verifyBanner: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
//     padding: Spacing.md, marginTop: Spacing.md,
//   },

//   // Section headers
//   sectionHeader: {
//     marginTop: Spacing.xl, marginBottom: Spacing.sm,
//     letterSpacing: 0.8,
//   },

//   // Setting groups
//   group: {
//     backgroundColor: Colors.background, borderRadius: Radius.lg,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
//     overflow: 'hidden',
//   },
//   row: {
//     flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
//     paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
//     borderBottomWidth: 1, borderBottomColor: Colors.border,
//   },
//   rowIcon: {
//     width: 36, height: 36, borderRadius: Radius.sm,
//     backgroundColor: Colors.surface,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   rowIconDestructive: { backgroundColor: Colors.errorLight },
//   chevron: { fontSize: 22 },

//   versionRow: { paddingVertical: Spacing.md },
//     input: {
//     marginTop: 8,
//     marginBottom: 10,
//     borderRadius: 10,
//     fontSize: 16,
//     lineHeight: 20,
//     padding: 8,
//     backgroundColor: 'rgba(151, 151, 151, 0.25)',
//   },
// });
