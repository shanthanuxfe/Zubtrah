import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useSettings, useThemeColors } from '@/hooks/useSettings';
import { usePageContentStyle, useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PickerModal } from '@/components/PickerModal';
import { notificationsAvailable } from '@/lib/notifications';
import { spacing, radius } from '@/lib/theme';

const REMINDER_OPTIONS = [
  { label: 'Same Day', value: 0 },
  { label: '1 Day before', value: 1 },
  { label: '3 Days before', value: 3 },
  { label: '7 Days before', value: 7 },
  { label: '14 Days before', value: 14 },
  { label: '30 Days before', value: 30 },
  { label: '60 Days before', value: 60 },
];

const CURRENCY_OPTIONS = [
  { label: 'USD $', value: 'USD $' },
  { label: 'EUR €', value: 'EUR €' },
  { label: 'GBP £', value: 'GBP £' },
  { label: 'INR ₹', value: 'INR ₹' },
  { label: 'JPY ¥', value: 'JPY ¥' },
  { label: 'CNY ¥', value: 'CNY ¥' },
  { label: 'RUB ₽', value: 'RUB ₽' },
  { label: 'BRL R$', value: 'BRL R$' },
  { label: 'AUD $', value: 'AUD $' },
  { label: 'CAD $', value: 'CAD $' },
  { label: 'SGD $', value: 'SGD $' },
  { label: 'AED د.إ', value: 'AED د.إ' },
  { label: 'CHF Fr', value: 'CHF Fr' },
  { label: 'SEK kr', value: 'SEK kr' },
  { label: 'NOK kr', value: 'NOK kr' },
  { label: 'DKK kr', value: 'DKK kr' },
  { label: 'MXN $', value: 'MXN $' },
  { label: 'ZAR R', value: 'ZAR R' },
  { label: 'KRW ₩', value: 'KRW ₩' },
  { label: 'TRY ₺', value: 'TRY ₺' },
];

// Pill-style button that shows current value and opens the picker modal
function PickerTrigger({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      style={[styles.trigger, { backgroundColor: colors.dropdownBg }]}
      onPress={onPress}>
      <Text style={[styles.triggerText, { color: colors.textDark }]} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={14} color={colors.textMuted} />
    </Pressable>
  );
}

function Toggle({
  value,
  onChange,
  showLabel = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  showLabel?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      style={[styles.toggleTrack, { backgroundColor: value ? colors.tealDark : '#C8C8C8' }]}
      onPress={() => onChange(!value)}>
      {showLabel && value && <Text style={styles.toggleLabel}>ON</Text>}
      <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const colors = useThemeColors();
  const { isDesktopWeb, showSidebar } = useResponsiveLayout();
  const pageContentStyle = usePageContentStyle({
    paddingHorizontal: spacing.xl,
    paddingBottom: showSidebar ? 48 : 100,
  });

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  // Temp state while picker is open — committed on Done
  const [tempCurrency, setTempCurrency] = useState(settings.currency);
  const [tempReminder, setTempReminder] = useState(settings.reminderDays);

  const currentCurrencyLabel =
    CURRENCY_OPTIONS.find((o) => o.value === settings.currency)?.label ?? settings.currency;
  const currentReminderLabel =
    REMINDER_OPTIONS.find((o) => o.value === settings.reminderDays)?.label ??
    `${settings.reminderDays} Days before`;

  const openCurrency = () => {
    setTempCurrency(settings.currency);
    setShowCurrencyPicker(true);
  };
  const openReminder = () => {
    setTempReminder(settings.reminderDays);
    setShowReminderPicker(true);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: pageContentStyle,
    title: {
      fontFamily: 'Inter-Bold', fontSize: 26, color: colors.tealDark,
      textAlign: isDesktopWeb ? 'left' : 'center', marginTop: spacing.xl,
    },
    subtitle: {
      fontFamily: 'Inter-Regular', fontSize: 14, color: colors.tealMid,
      textAlign: isDesktopWeb ? 'left' : 'center', marginBottom: spacing.xxl, marginTop: 4,
    },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xl },
    cardBottom: { marginTop: spacing.xl },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    rowLabel: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.tealDark },
    divider: { height: 1, backgroundColor: colors.divider },
    themeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    linkLabel: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.tealDark },
    logoutLabel: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.errorRed },
  });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Customize your Preferences</Text>

        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Notifications</Text>
            <Toggle value={settings.notifications} onChange={(v) => update({ notifications: v })} showLabel />
          </View>

          {!notificationsAvailable() ? (
            <View style={styles.warningRow}>
              <Text style={styles.warningText}>
                Notifications aren't supported in Expo Go. Use a development build to enable reminders.
              </Text>
            </View>
          ) : null}

          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.rowLabel}>Reminder Days</Text>
            <PickerTrigger label={currentReminderLabel} onPress={openReminder} />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.rowLabel}>Currency</Text>
            <PickerTrigger label={currentCurrencyLabel} onPress={openCurrency} />
          </View>

          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.rowLabel}>Theme</Text>
            <View style={s.themeRow}>
              <Text style={styles.sunEmoji}>&#9728;&#65039;</Text>
              <Toggle value={settings.darkMode} onChange={(v) => update({ darkMode: v })} />
              <Text style={styles.moonEmoji}>&#127769;</Text>
            </View>
          </View>
        </View>

        <View style={[s.card, s.cardBottom]}>
          <Pressable
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.6 }]}
            onPress={() => Alert.alert('About App', 'Subscription Reminder v1.0')}>
            <Text style={s.linkLabel}>About App</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.6 }]}
            onPress={() => Alert.alert('Get Help', 'Email: support@subscriptionreminder.app')}>
            <Text style={s.linkLabel}>Get Help</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.6 }]}
            onPress={() => Alert.alert('Logout', 'You have been logged out.')}>
            <Text style={s.logoutLabel}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Currency Picker Modal */}
      <PickerModal
        visible={showCurrencyPicker}
        title="Currency"
        columns={[
          {
            label: '',
            items: CURRENCY_OPTIONS,
            selectedValue: tempCurrency,
            onValueChange: (v) => setTempCurrency(String(v)),
            width: 200,
          },
        ]}
        onDone={() => {
          update({ currency: tempCurrency });
          setShowCurrencyPicker(false);
        }}
        onCancel={() => setShowCurrencyPicker(false)}
      />

      {/* Reminder Days Picker Modal */}
      <PickerModal
        visible={showReminderPicker}
        title="Reminder Days"
        columns={[
          {
            label: '',
            items: REMINDER_OPTIONS,
            selectedValue: tempReminder,
            onValueChange: (v) => setTempReminder(Number(v)),
            width: 200,
          },
        ]}
        onDone={() => {
          update({ reminderDays: tempReminder });
          setShowReminderPicker(false);
        }}
        onCancel={() => setShowReminderPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 160,
  },
  triggerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    flex: 1,
  },
  toggleTrack: {
    width: 64, height: 32, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4,
  },
  toggleLabel: { fontFamily: 'Inter-Bold', fontSize: 10, color: '#FFFFFF', marginLeft: 2 },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { marginLeft: 'auto' },
  toggleThumbOff: { marginLeft: 0 },
  sunEmoji: { fontSize: 20 },
  moonEmoji: { fontSize: 18 },
  warningRow: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  warningText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#B4732B',
    lineHeight: 16,
  },
});
