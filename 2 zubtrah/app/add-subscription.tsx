import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, type BillingCycle } from '@/lib/supabase';
import { useThemeColors, getCurrencySymbol, useSettings, resyncNotifications } from '@/hooks/useSettings';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PickerModal } from '@/components/PickerModal';
import { spacing, radius } from '@/lib/theme';

const FORM_MAX_WIDTH = 800;

const MONTHS_ITEMS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((m, i) => ({ label: m, value: i }));

function getYearItems() {
  const cur = new Date().getFullYear();
  return Array.from({ length: 13 }, (_, i) => {
    const y = cur - 1 + i;
    return { label: String(y), value: y };
  });
}

function getDayItems(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
}

function defaultDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const colors = useThemeColors();
  const { settings } = useSettings();
  const { isDesktopWeb } = useResponsiveLayout();
  const sym = getCurrencySymbol(settings.currency);

  const initial = defaultDate();
  const initDate = new Date(initial + 'T00:00:00');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [renewalDate, setRenewalDate] = useState(initial);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(initDate.getMonth());
  const [tempDay, setTempDay] = useState(initDate.getDate());
  const [tempYear, setTempYear] = useState(initDate.getFullYear());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', editingId)
        .maybeSingle();
      if (data) {
        setName(data.name);
        setPrice(String(data.price));
        setBillingCycle(data.billing_cycle as BillingCycle);
        setRenewalDate(data.renewal_date);
        const d = new Date(data.renewal_date + 'T00:00:00');
        setTempMonth(d.getMonth());
        setTempDay(d.getDate());
        setTempYear(d.getFullYear());
      }
    })();
  }, [editingId]);

  const formattedDate = (() => {
    const [y, m, d] = renewalDate.split('-');
    return `${m}/${d}/${y}`;
  })();

  const validate = () => {
    const e: { name?: string; price?: string } = {};
    if (!name.trim()) e.name = 'Name is required';
    // Reject comma decimal separator; require positive number
    const cleaned = price.trim();
    if (!cleaned) {
      e.price = 'Enter a valid price';
    } else if (/,/.test(cleaned)) {
      e.price = 'Use a period for decimals (e.g. 9.99)';
    } else if (isNaN(Number(cleaned)) || Number(cleaned) <= 0) {
      e.price = 'Enter a valid price';
    } else if (Number(cleaned) > 1000000) {
      e.price = 'Price seems too high';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: name.trim().slice(0, 100),
      price: Math.round(Number(price) * 100) / 100,
      currency: settings.currency,
      billing_cycle: billingCycle,
      renewal_date: renewalDate,
      category: 'Other',
      notes: null,
      active: true,
      updated_at: new Date().toISOString(),
    };
    const result = editingId
      ? await supabase.from('subscriptions').update(payload).eq('id', editingId)
      : await supabase.from('subscriptions').insert({ ...payload, created_at: new Date().toISOString() });
    setSaving(false);
    if (result.error) { console.error(result.error.message); return; }
    // Reschedule notifications with the updated subscription list
    resyncNotifications(settings).catch(() => {});
    router.back();
  };

  const handleDelete = () => {
    if (!editingId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!editingId) return;
    setDeleting(true);
    await supabase.from('subscriptions').delete().eq('id', editingId);
    resyncNotifications(settings).catch(() => {});
    setDeleting(false);
    setShowDeleteConfirm(false);
    router.back();
  };

  const commitDate = () => {
    const mm = String(tempMonth + 1).padStart(2, '0');
    const maxDay = new Date(tempYear, tempMonth + 1, 0).getDate();
    const dd = String(Math.min(tempDay, maxDay)).padStart(2, '0');
    setRenewalDate(`${tempYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[s.pageShell, isDesktopWeb && s.pageShellDesktop]}>
        <View style={[s.pageContent, isDesktopWeb && s.pageContentDesktop]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
            <ArrowLeft size={24} color={colors.tealDark} strokeWidth={2} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.headerTitle, { color: colors.tealDark }]}>
              {editingId ? 'Edit Subscription' : 'Add Subscription'}
            </Text>
            <Text style={[s.headerSub, { color: colors.tealMid }]}>
              Fill the details and select Save
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <ScrollView
          contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={[s.fieldLabel, { color: colors.tealDark }]}>Subscription Name</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, color: colors.textDark }, errors.name && s.inputError]}
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
            placeholder="e.g. Netflix, Spotify"
            placeholderTextColor={colors.textMuted}
          />
          {errors.name ? <Text style={s.errorText}>{errors.name}</Text> : null}

          <Text style={[s.fieldLabel, { color: colors.tealDark }]}>Price</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.inputBg }, errors.price && s.inputError]}>
            <Text style={[s.dollarSign, { color: colors.textDark }]}>{sym} </Text>
            <TextInput
              style={[s.priceInput, { color: colors.textDark }]}
              value={price}
              onChangeText={(v) => { setPrice(v); setErrors((e) => ({ ...e, price: undefined })); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          {errors.price ? <Text style={s.errorText}>{errors.price}</Text> : null}

          <Text style={[s.fieldLabel, { color: colors.tealDark }]}>Billing Cycle</Text>
          <View style={s.cycleRow}>
            {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
              <Pressable
                key={cycle}
                style={[
                  s.cycleBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  billingCycle === cycle && { backgroundColor: colors.tealDark, borderColor: colors.tealDark },
                ]}
                onPress={() => setBillingCycle(cycle)}>
                <Text style={[s.cycleBtnText, { color: colors.tealDark }, billingCycle === cycle && { color: '#FFFFFF' }]}>
                  {cycle === 'monthly' ? 'Month' : 'Year'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.fieldLabel, { color: colors.tealDark }]}>Renewal Date</Text>
          <Pressable style={[s.dateInput, { backgroundColor: colors.inputBg }]} onPress={() => setShowDatePicker(true)}>
            <Text style={[s.dateText, { color: colors.textDark }]}>{formattedDate}</Text>
            <Calendar size={22} color={colors.tealDark} strokeWidth={1.5} />
          </Pressable>

          {editingId ? (
            <Pressable
              style={({ pressed }) => [s.deleteBtn, { marginTop: spacing.xxl }, pressed && { opacity: 0.7 }]}
              onPress={handleDelete}>
              <Text style={s.deleteBtnText}>Delete Subscription</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* Save button */}
        <View style={[s.footer, { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.tealMid }, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.saveBtnText}>Save Subscription</Text>}
          </Pressable>
        </View>
        </View>
        </View>
      </KeyboardAvoidingView>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.tealDark }]}>Delete Subscription</Text>
            <Text style={[s.modalBody, { color: colors.textDark }]}>
              Remove &quot;{name}&quot;? This action cannot be undone.
            </Text>
            <View style={s.modalActions}>
              <Pressable
                style={({ pressed }) => [s.modalCancelBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }, pressed && { opacity: 0.7 }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}>
                <Text style={[s.modalCancelText, { color: colors.textDark }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.modalDeleteBtn, pressed && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={s.modalDeleteText}>Delete</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Wheel date picker */}
      <PickerModal
        visible={showDatePicker}
        title="Renewal Date"
        columns={[
          { label: 'Month', items: MONTHS_ITEMS, selectedValue: tempMonth, onValueChange: (v) => setTempMonth(Number(v)), width: 130 },
          { label: 'Day', items: getDayItems(tempYear, tempMonth), selectedValue: tempDay, onValueChange: (v) => setTempDay(Number(v)), width: 70 },
          { label: 'Year', items: getYearItems(), selectedValue: tempYear, onValueChange: (v) => setTempYear(Number(v)), width: 90 },
        ]}
        onDone={commitDate}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  pageShell: { flex: 1 },
  pageShellDesktop: { alignItems: 'center' },
  pageContent: { flex: 1, width: '100%' },
  pageContentDesktop: { maxWidth: FORM_MAX_WIDTH },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 22 },
  headerSub: { fontFamily: 'Inter-Regular', fontSize: 14, marginTop: 2 },
  form: { paddingHorizontal: spacing.xl },
  fieldLabel: { fontFamily: 'Inter-SemiBold', fontSize: 15, marginBottom: spacing.sm, marginTop: spacing.xl },
  input: { borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: 16, fontFamily: 'Inter-Regular', fontSize: 16 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, paddingHorizontal: spacing.xl },
  dollarSign: { fontFamily: 'Inter-Regular', fontSize: 16 },
  priceInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 16, paddingVertical: 16 },
  inputError: { borderWidth: 1.5, borderColor: '#CC3333' },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#CC3333', marginTop: 4 },
  cycleRow: { flexDirection: 'row', gap: spacing.md },
  cycleBtn: { paddingVertical: 14, paddingHorizontal: spacing.xxxl, borderRadius: radius.md, borderWidth: 1 },
  cycleBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: 16,
  },
  dateText: { fontFamily: 'Inter-Regular', fontSize: 16 },
  deleteBtn: { borderWidth: 1.5, borderColor: '#CC3333', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#CC3333' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  saveBtn: { borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: 'Inter-Bold', fontSize: 17, color: '#FFFFFF' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  modalCard: {
    width: '100%', maxWidth: 360, borderRadius: radius.lg,
    padding: spacing.xxl, gap: spacing.lg,
  },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 20 },
  modalBody: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalCancelBtn: {
    flex: 1, borderRadius: radius.md, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  modalDeleteBtn: {
    flex: 1, borderRadius: radius.md, backgroundColor: '#CC3333',
    paddingVertical: 14, alignItems: 'center',
  },
  modalDeleteText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#FFFFFF' },
});
