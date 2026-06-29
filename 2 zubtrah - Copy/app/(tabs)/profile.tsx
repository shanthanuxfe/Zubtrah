import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil } from 'lucide-react-native';
import { type Subscription, monthlyEquivalent, getSubscriptions } from '@/lib/supabase';
import { useSettings, useThemeColors, getCurrencySymbol } from '@/hooks/useSettings';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { spacing, radius } from '@/lib/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const colors = useThemeColors();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [draftName, setDraftName] = useState(settings.userName);
  const [draftEmail, setDraftEmail] = useState(settings.userEmail);

  const load = useCallback(async (silent = false) => {
    setRefreshing(silent);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions', error);
      setSubscriptions([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalCount = subscriptions.length;
  const monthlySpend = subscriptions.reduce(
    (sum, s) => sum + monthlyEquivalent(Number(s.price), s.billing_cycle),
    0
  );
  const sym = getCurrencySymbol(settings.currency);

  const openEdit = () => {
    setDraftName(settings.userName);
    setDraftEmail(settings.userEmail);
    setShowEditModal(true);
  };

  const saveProfile = () => {
    if (!draftName.trim()) { Alert.alert('Name is required'); return; }
    update({ userName: draftName.trim(), userEmail: draftEmail.trim() });
    setShowEditModal(false);
  };

  const handlePhotoOptions = () => {
    if (settings.userPhoto) {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Change Photo', onPress: () => { setPhotoUrlInput(''); setShowPhotoModal(true); } },
        { text: 'Remove Photo', style: 'destructive', onPress: () => update({ userPhoto: null }) },
        { text: 'Cancel', style: 'cancel' },
      ], { cancelable: true });
      return;
    }
    setPhotoUrlInput('');
    setShowPhotoModal(true);
  };

  const savePhoto = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) { update({ userPhoto: null }); setShowPhotoModal(false); return; }
    update({ userPhoto: trimmed });
    setShowPhotoModal(false);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    title: {
      fontFamily: 'Inter-Bold', fontSize: 26, color: colors.tealDark,
      textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.xl,
    },
    profileCard: {
      backgroundColor: colors.card, borderRadius: radius.xl,
      paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl,
      alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl,
    },
    name: { fontFamily: 'Inter-Bold', fontSize: 18, color: colors.tealDark },
    email: { fontFamily: 'Inter-Regular', fontSize: 15, color: colors.tealMid },
    statsCard: {
      backgroundColor: colors.card, borderRadius: radius.xl,
      paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    },
    statRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingVertical: 18,
    },
    statDivider: { height: 1, backgroundColor: colors.divider },
    statLabel: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.tealDark },
    statValue: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.tealDark },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.card, borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl, padding: spacing.xxl,
      paddingBottom: insets.bottom + spacing.xxl,
    },
    modalTitle: {
      fontFamily: 'Inter-Bold', fontSize: 20, color: colors.tealDark,
      textAlign: 'center', marginBottom: spacing.xl,
    },
    modalField: {
      fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.tealDark,
      marginBottom: spacing.sm, marginTop: spacing.md,
    },
    modalInput: {
      backgroundColor: colors.inputBg, borderRadius: radius.xl,
      paddingHorizontal: spacing.xl, paddingVertical: 14,
      fontFamily: 'Inter-Regular', fontSize: 16, color: colors.textDark,
      borderWidth: 1, borderColor: colors.border,
    },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
    cancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: radius.md,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center',
    },
    cancelText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textSecondary },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.tealDark, alignItems: 'center' },
    saveText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#FFFFFF' },
  });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        <Text style={s.title}>Profile</Text>

        <View style={s.profileCard}>
          <View style={styles.photoWrap}>
            <ProfileAvatar
              photoUri={settings.userPhoto}
              name={settings.userName}
              size={90}
            />
            <Pressable style={styles.editBadge} onPress={handlePhotoOptions}>
              <Pencil size={13} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            <Text style={s.name}>{settings.userName}</Text>
            <Pressable onPress={openEdit} style={styles.editNameBtn}>
              <Pencil size={14} color="#4FC3F7" strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={s.email}>{settings.userEmail}</Text>
        </View>

        <View style={s.statsCard}>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total Subscription</Text>
            <Text style={s.statValue}>{totalCount}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statRow}>
            <Text style={s.statLabel}>Monthly Spend</Text>
            <Text style={s.statValue}>{sym}{Math.round(monthlySpend).toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit name/email modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={s.modalSheet}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <Text style={s.modalField}>Name</Text>
              <TextInput
                style={s.modalInput}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <Text style={s.modalField}>Email</Text>
              <TextInput
                style={s.modalInput}
                value={draftEmail}
                onChangeText={setDraftEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={s.modalActions}>
                <Pressable style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.7 }]} onPress={() => setShowEditModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]} onPress={saveProfile}>
                  <Text style={s.saveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Photo URL modal — works on every platform (web, iOS, Android) */}
      <Modal visible={showPhotoModal} transparent animationType="slide" onRequestClose={() => setShowPhotoModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowPhotoModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={s.modalSheet}>
              <Text style={s.modalTitle}>Profile Photo</Text>
              <Text style={s.modalField}>Image URL</Text>
              <TextInput
                style={s.modalInput}
                value={photoUrlInput}
                onChangeText={setPhotoUrlInput}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor={colors.textMuted}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <View style={s.modalActions}>
                <Pressable style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.7 }]} onPress={() => setShowPhotoModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]} onPress={savePhoto}>
                  <Text style={s.saveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: { position: 'relative', marginBottom: 4 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#4FC3F7', alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editNameBtn: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: '#E8F8FF', alignItems: 'center', justifyContent: 'center',
  },
});
