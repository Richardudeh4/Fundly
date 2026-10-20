import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  loanApi,
  ApiError,
  type LoanSummary,
  type LoanStatus,
} from '@/RequestHandler/Request';

const { width } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────────
const TERM_OPTIONS = [3, 6, 12, 18, 24];
const MIN_AMOUNT = 10_000;   // ₦10,000
const MAX_AMOUNT = 5_000_000; // ₦5,000,000
const ANNUAL_RATE = 0.15;

function calcInstalment(principal: number, termMonths: number): number {
  const r = ANNUAL_RATE / 12;
  const factor = Math.pow(1 + r, termMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}

function formatNaira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function loanStatusColor(status: LoanStatus): string {
  switch (status) {
    case 'ACTIVE': return Colors.success;
    case 'PAID': return Colors.primary;
    case 'PENDING': return Colors.warning;
    case 'DEFAULTED': return Colors.error;
    default: return Colors.text.muted;
  }
}

// ── Apply form ────────────────────────────────────────────────────────────────
function ApplyForm({ onSuccess }: { onSuccess: () => void }) {
  const [amountStr, setAmountStr] = useState('');
  const [term, setTerm] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const amount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const amountKobo = Math.round(amount * 100);
  const instalment = amount >= MIN_AMOUNT ? calcInstalment(amountKobo, term) : 0;
  const totalOwed = instalment * term;
  const isValid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  const handleApply = async () => {
    if (!isValid) {
      setError(`Enter an amount between ₦${MIN_AMOUNT.toLocaleString()} and ₦${MAX_AMOUNT.toLocaleString()}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loanApi.apply({
        amountKobo,
        termMonths: term,
        purpose: purpose.trim() || undefined,
      });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successBox}>
        <AppText style={{ fontSize: 48, textAlign: 'center' }}>🎉</AppText>
        <AppText variant="subheading" align="center" style={{ marginTop: Spacing.md }}>
          Application submitted!
        </AppText>
        <AppText variant="bodySmall" align="center" color={Colors.text.muted} style={{ marginTop: Spacing.xs }}>
          Your loan is under review. We'll notify you shortly.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.formCard}>
      <AppText variant="subheading" style={{ marginBottom: Spacing.lg }}>Apply for a Loan</AppText>

      {/* Amount */}
      <AppText variant="label" style={styles.fieldLabel}>Loan Amount (₦)</AppText>
      <View style={styles.amountInput}>
        <AppText style={styles.nairaPrefix}>₦</AppText>
        <TextInput
          style={styles.amountField}
          placeholder="0.00"
          placeholderTextColor={Colors.text.muted}
          keyboardType="numeric"
          value={amountStr}
          onChangeText={(t) => {
            setError('');
            setAmountStr(t.replace(/[^0-9.]/g, ''));
          }}
        />
      </View>
      {amountStr !== '' && !isValid && (
        <AppText variant="caption" color={Colors.error} style={{ marginTop: 4 }}>
          Amount must be ₦{MIN_AMOUNT.toLocaleString()} – ₦{MAX_AMOUNT.toLocaleString()}
        </AppText>
      )}

      {/* Term selector */}
      <AppText variant="label" style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Repayment Term</AppText>
      <View style={styles.termRow}>
        {TERM_OPTIONS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.termChip, term === t && styles.termChipActive]}
            onPress={() => setTerm(t)}
            activeOpacity={0.8}
          >
            <AppText
              variant="caption"
              style={[styles.termChipText, term === t && styles.termChipTextActive]}
            >
              {t}mo
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purpose */}
      <AppText variant="label" style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Purpose (optional)</AppText>
      <TextInput
        style={styles.purposeInput}
        placeholder="e.g. School fees, Business"
        placeholderTextColor={Colors.text.muted}
        value={purpose}
        onChangeText={setPurpose}
        maxLength={100}
      />

      {/* Summary */}
      {amount >= MIN_AMOUNT && (
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <AppText variant="bodySmall" color={Colors.text.muted}>Monthly payment</AppText>
            <AppText variant="label">{formatNaira(instalment)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="bodySmall" color={Colors.text.muted}>Total repayment</AppText>
            <AppText variant="label">{formatNaira(totalOwed)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="bodySmall" color={Colors.text.muted}>Interest rate (annual)</AppText>
            <AppText variant="label">{(ANNUAL_RATE * 100).toFixed(0)}%</AppText>
          </View>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <AppText variant="caption" color={Colors.error}>{error}</AppText>
        </View>
      ) : null}

      <AppButton
        label="Submit Application"
        onPress={handleApply}
        loading={loading}
        disabled={!isValid}
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );
}

// ── Loan history card ─────────────────────────────────────────────────────────
function LoanHistoryCard({ loan }: { loan: LoanSummary }) {
  const progress = loan.totalOwedKobo > 0
    ? 1 - loan.balanceKobo / loan.totalOwedKobo
    : 1;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={{ flex: 1 }}>
          <AppText variant="label">{loan.purpose ?? 'Personal Loan'}</AppText>
          <AppText variant="caption">
            {new Date(loan.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </AppText>
        </View>
        <View style={[styles.statusPill, { backgroundColor: loanStatusColor(loan.status) + '1A' }]}>
          <AppText
            variant="caption"
            style={{ color: loanStatusColor(loan.status), fontWeight: FontWeight.semibold }}
          >
            {loan.status}
          </AppText>
        </View>
      </View>

      <View style={styles.historyAmounts}>
        <View>
          <AppText variant="caption" color={Colors.text.muted}>Principal</AppText>
          <AppText variant="label">{formatNaira(loan.principalKobo)}</AppText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <AppText variant="caption" color={Colors.text.muted}>Monthly</AppText>
          <AppText variant="label">{formatNaira(loan.monthlyInstalmentKobo)}</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="caption" color={Colors.text.muted}>Balance</AppText>
          <AppText variant="label" color={Colors.primary}>{formatNaira(loan.balanceKobo)}</AppText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.round(progress * 100))}%` }]} />
      </View>
      <AppText variant="caption" color={Colors.text.muted} style={{ marginTop: 4 }}>
        {Math.min(100, Math.round(progress * 100))}% repaid · {loan.termMonths} months
      </AppText>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LoanScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'apply' | 'history'>('apply');
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await loanApi.list();
      setLoans(data);
      // If there's an active/pending loan, switch to history tab by default
      if (data.some((l) => l.status === 'ACTIVE' || l.status === 'PENDING')) {
        setTab('history');
      }
    } catch {
      // Silently ignore; stale data is fine
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + Spacing.lg }]}>
        <AppText variant="heading">Loans</AppText>
        <AppText variant="bodySmall" color={Colors.text.muted}>Manage and apply for loans</AppText>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['apply', 'history'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && styles.tabItemActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <AppText
              variant="label"
              color={tab === t ? Colors.primary : Colors.text.muted}
            >
              {t === 'apply' ? 'Apply' : `History (${loans.length})`}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
        {tab === 'apply' ? (
          <ApplyForm onSuccess={() => { load(); setTab('history'); }} />
        ) : (
          <>
            {!initialLoad && loans.length === 0 ? (
              <View style={styles.emptyState}>
                <AppText style={{ fontSize: 40, textAlign: 'center' }}>📋</AppText>
                <AppText variant="subheading" align="center" style={{ marginTop: Spacing.sm }}>
                  No loan history
                </AppText>
                <AppText variant="bodySmall" align="center" color={Colors.text.muted} style={{ marginTop: Spacing.xs }}>
                  Your past and current loans will appear here
                </AppText>
                <AppButton
                  label="Apply for a Loan"
                  variant="outline"
                  onPress={() => setTab('apply')}
                  style={{ marginTop: Spacing.lg }}
                />
              </View>
            ) : (
              loans.map((l) => <LoanHistoryCard key={l.id} loan={l} />)
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  screenHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.background },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.border,
    borderRadius: Radius.md,
    padding: 3,
  },
  tabItem: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm - 2 },
  tabItemActive: { backgroundColor: Colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },

  // Form card
  formCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  fieldLabel: { marginBottom: Spacing.xs },
  amountInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 52,
  },
  nairaPrefix: { fontSize: FontSize.lg, color: Colors.text.muted, marginRight: 4 },
  amountField: { flex: 1, fontSize: FontSize.lg, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  termRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  termChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  termChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termChipText: { color: Colors.text.secondary },
  termChipTextActive: { color: Colors.text.inverse },
  purposeInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 48,
    color: Colors.text.primary, fontSize: FontSize.md,
  },
  summaryBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  errorBox: {
    backgroundColor: Colors.errorLight, borderRadius: Radius.sm,
    padding: Spacing.sm, marginTop: Spacing.md,
  },
  successBox: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  // History
  historyCard: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  historyAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  progressTrack: {
    height: 6, backgroundColor: Colors.border,
    borderRadius: Radius.full, marginTop: Spacing.md, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  emptyState: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
});
