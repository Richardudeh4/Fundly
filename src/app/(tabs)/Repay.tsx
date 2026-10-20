import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  loanApi,
  repaymentApi,
  ApiError,
  type LoanSummary,
  type RepaymentSummary,
} from '@/RequestHandler/Request';
import { Ionicons } from '@expo/vector-icons';

// ── Kobo helpers ───────────────────────────────────────────────────────────────
function formatNaira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Repayment confirm modal ────────────────────────────────────────────────────
function ConfirmModal({
  visible,
  loan,
  amountKobo,
  onConfirm,
  onCancel,
  loading,
}: {
  visible: boolean;
  loan: LoanSummary | null;
  amountKobo: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!loan) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
            <Ionicons name="card" size={30} color="#1E90FF"/>
          <AppText variant="subheading" align="center" style={{ marginTop: Spacing.md }}>
            Confirm Payment
          </AppText>
          <AppText variant="bodySmall" align="center" color={Colors.text.muted} style={{ marginTop: Spacing.xs }}>
            You're about to pay
          </AppText>
          <AppText style={styles.confirmAmount}>{formatNaira(amountKobo)}</AppText>
          <View style={styles.confirmDetail}>
            <AppText variant="bodySmall" color={Colors.text.muted}>Loan</AppText>
            <AppText variant="label">{loan.purpose ?? 'Personal Loan'}</AppText>
          </View>
          <View style={styles.confirmDetail}>
            <AppText variant="bodySmall" color={Colors.text.muted}>Remaining after</AppText>
            <AppText variant="label" color={Colors.primary}>
              {formatNaira(Math.max(0, loan.balanceKobo - amountKobo))}
            </AppText>
          </View>
          <View style={styles.modalActions}>
            <AppButton label="Cancel" onPress={onCancel} variant="outline" fullWidth={false} style={{ flex: 1 }} />
            <AppButton label="Pay Now" onPress={onConfirm} loading={loading} fullWidth={false} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Repayment history row ─────────────────────────────────────────────────────
function RepayRow({ item }: { item: RepaymentSummary }) {
  return (
    <View style={styles.repayRow}>
      <View style={[styles.repayIcon, item.status === 'SUCCESS' ? styles.repayIconSuccess : styles.repayIconFail]}>
        <AppText style={{ fontSize: 16 }}>{item.status === 'SUCCESS' ? '✓' : '✕'}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="label">Repayment</AppText>
        <AppText variant="caption">
          {item.paidAt
            ? new Date(item.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
            : new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText
          variant="label"
          color={item.status === 'SUCCESS' ? Colors.success : Colors.error}
        >
          {formatNaira(item.amountKobo)}
        </AppText>
        <AppText variant="caption">{item.status}</AppText>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RepayScreen() {
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [repayments, setRepayments] = useState<RepaymentSummary[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanSummary | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [loansData, repData] = await Promise.all([
        loanApi.list(),
        repaymentApi.listAll(),
      ]);
      // Show ACTIVE and PENDING — pending loans are visible but not payable yet
      const repayableLoans = loansData.filter((l) => l.status === 'ACTIVE' || l.status === 'PENDING');
      setLoans(repayableLoans);
      setRepayments(repData);
      // Auto-select the first ACTIVE loan for payment; fall back to first pending
      const firstActive = repayableLoans.find((l) => l.status === 'ACTIVE') ?? repayableLoans[0];
      if (firstActive && !selectedLoan) {
        setSelectedLoan(firstActive);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [selectedLoan]);

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const amount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const amountKobo = Math.round(amount * 100);
  const isValid =
    selectedLoan !== null &&
    selectedLoan.status === 'ACTIVE' &&
    amountKobo > 0 &&
    amountKobo <= selectedLoan.balanceKobo;

  const handlePay = async () => {
    if (!selectedLoan || !isValid) return;
    setPaying(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanApi.repay(selectedLoan.id, {
        amountKobo,
        reference: uuid(),
      });
      setShowConfirm(false);
      setAmountStr('');
      setSuccessMsg('Payment successful! Your balance has been updated.');
      await load();
    } catch (err) {
      setShowConfirm(false);
      setErrorMsg(err instanceof ApiError ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const totalPaid = repayments
    .filter((r) => r.status === 'SUCCESS')
    .reduce((s, r) => s + r.amountKobo, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + Spacing.lg }]}>
        <AppText variant="heading">Repayments</AppText>
        <AppText variant="bodySmall" color={Colors.text.muted}>Make and track your payments</AppText>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg }}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="rgba(255,255,255,0.7)">Total paid</AppText>
            <AppText style={styles.summaryValue}>{formatNaira(totalPaid)}</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="rgba(255,255,255,0.7)">Payments made</AppText>
            <AppText style={styles.summaryValue}>
              {repayments.filter((r) => r.status === 'SUCCESS').length}
            </AppText>
          </View>
        </View>

        {/* Make payment */}
        {loans.length > 0 ? (
          <View style={styles.payCard}>
            <AppText variant="subheading" style={{ marginBottom: Spacing.md }}>Make a Payment</AppText>

            {/* Loan selector (show if multiple active loans) */}
            {loans.length > 1 && (
              <>
                <AppText variant="label" style={styles.fieldLabel}>Select Loan</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  {loans.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.loanChip, selectedLoan?.id === l.id && styles.loanChipActive]}
                      onPress={() => setSelectedLoan(l)}
                      activeOpacity={0.8}
                    >
                      <AppText
                        variant="caption"
                        color={selectedLoan?.id === l.id ? Colors.text.inverse : Colors.text.secondary}
                      >
                        {l.purpose ?? 'Personal'} · {formatNaira(l.balanceKobo)}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Selected loan balance */}
            {selectedLoan && selectedLoan.status === 'PENDING' && (
              <View style={styles.pendingBanner}>
                <AppText style={{ fontSize: 16 }}>⏳</AppText>
                <AppText variant="bodySmall" color={Colors.warning} style={{ flex: 1, marginLeft: Spacing.sm }}>
                  Your loan is under review. Repayments will be enabled once it's approved.
                </AppText>
              </View>
            )}
            {selectedLoan && selectedLoan.status === 'ACTIVE' && (
              <View style={styles.balanceRow}>
                <AppText variant="bodySmall" color={Colors.text.muted}>Outstanding balance</AppText>
                <AppText variant="label" color={Colors.primary}>{formatNaira(selectedLoan.balanceKobo)}</AppText>
              </View>
            )}

            {/* Amount input — only shown for ACTIVE loans */}
            {selectedLoan?.status === 'ACTIVE' && (
            <>
            <AppText variant="label" style={styles.fieldLabel}>Payment Amount (₦)</AppText>
            <View style={styles.amountInput}>
              <AppText style={styles.nairaPrefix}>₦</AppText>
              <TextInput
                style={styles.amountField}
                placeholder="0.00"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={(t) => {
                  setAmountStr(t.replace(/[^0-9.]/g, ''));
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              />
              {selectedLoan && (
                <TouchableOpacity
                  onPress={() => setAmountStr((selectedLoan.monthlyInstalmentKobo / 100).toString())}
                  activeOpacity={0.7}
                >
                  <AppText variant="caption" color={Colors.primary} style={{ fontWeight: FontWeight.semibold }}>
                    Monthly
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
            {amountStr !== '' && selectedLoan && amountKobo > selectedLoan.balanceKobo && (
              <AppText variant="caption" color={Colors.error} style={{ marginTop: 4 }}>
                Amount exceeds outstanding balance of {formatNaira(selectedLoan.balanceKobo)}
              </AppText>
            )}

            {successMsg ? (
              <View style={styles.successBanner}>
                <AppText variant="caption" color={Colors.success}>{successMsg}</AppText>
              </View>
            ) : null}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.error}>{errorMsg}</AppText>
              </View>
            ) : null}

            <AppButton
              label="Continue to Pay"
              onPress={() => setShowConfirm(true)}
              disabled={!isValid}
              style={{ marginTop: Spacing.lg }}
            />
            </>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppText variant="subheading" align="center" style={{ marginTop: Spacing.sm }}>
              No active loans
            </AppText>
            <AppText variant="bodySmall" align="center" color={Colors.text.muted} style={{ marginTop: Spacing.xs }}>
              You don't have any loans due for repayment
            </AppText>
          </View>
        )}

        {/* Payment history */}
        {repayments.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <AppText variant="subheading" style={{ marginBottom: Spacing.md }}>Payment History</AppText>
            <View style={styles.historyList}>
              {repayments.map((r) => (
                <RepayRow key={r.id} item={r} />
              ))}
            </View>
          </View>
        )}
      </View>

      <ConfirmModal
        visible={showConfirm}
        loan={selectedLoan}
        amountKobo={amountKobo}
        onConfirm={handlePay}
        onCancel={() => setShowConfirm(false)}
        loading={paying}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  screenHeader: {
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', marginTop: Spacing.lg,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryValue: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.text.inverse, marginTop: Spacing.xs,
  },

  // Pay card
  payCard: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.lg, marginTop: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  fieldLabel: { marginBottom: Spacing.xs },
  loanChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  loanChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  amountInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 52,
  },
  nairaPrefix: { fontSize: FontSize.lg, color: Colors.text.muted, marginRight: 4 },
  amountField: {
    flex: 1, fontSize: FontSize.lg,
    color: Colors.text.primary, fontWeight: FontWeight.semibold,
  },
  successBanner: {
    backgroundColor: Colors.successLight, borderRadius: Radius.sm,
    padding: Spacing.sm, marginTop: Spacing.md,
  },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.warning + '1A',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight, borderRadius: Radius.sm,
    padding: Spacing.sm, marginTop: Spacing.md,
  },

  // History
  historyList: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  repayRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  repayIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  repayIconSuccess: { backgroundColor: Colors.successLight },
  repayIconFail: { backgroundColor: Colors.errorLight },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: Spacing.xxl,
  },
  confirmAmount: {
    fontSize: 32, fontWeight: FontWeight.extrabold,
    color: Colors.text.primary, textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight:45,
  },
  confirmDetail: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },

  emptyState: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
});
