import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';


import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import {
  type Subscription,
  monthlyEquivalent,
  daysUntil,
  formatRenewalLabel,
  daysLeftColor,
  getSubscriptions,
} from '@/lib/supabase';
import { useSettings, useThemeColors, getCurrencySymbol, useNotificationSync } from '@/hooks/useSettings';
import { usePageContentStyle, useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing, radius } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const colors = useThemeColors();
  const { isMobile, isDesktopWeb, isLaptop, showSidebar } = useResponsiveLayout();
  const pageContentStyle = usePageContentStyle({
    paddingHorizontal: spacing.xl,
    paddingBottom: showSidebar ? 48 : 100,
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    setRefreshing(silent);
    try {
      const data = await getSubscriptions();
      const sorted = [...data].sort((a, b) => a.renewal_date.localeCompare(b.renewal_date));
      setSubscriptions(sorted);
    } catch (error) {
      console.error('Failed to load subscriptions', error);
      setSubscriptions([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Keep scheduled notifications in sync whenever the subscription list or
  // notification settings change
  useNotificationSync(subscriptions);

  const sym = getCurrencySymbol(settings.currency);

  const filtered = subscriptions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Monthly total: monthly subs + yearly subs / 12
  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + monthlyEquivalent(Number(s.price), s.billing_cycle),
    0
  );

  // Top 3 upcoming renewals — only future/today, sorted ascending
  const top3 = [...subscriptions]
    .filter((s) => daysUntil(s.renewal_date) >= 0)
    .sort((a, b) => daysUntil(a.renewal_date) - daysUntil(b.renewal_date))
    .slice(0, 3);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: pageContentStyle,
    brandHeader: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    brandTitle: {
      fontFamily: 'Inter-Bold',
      fontSize: 20,
      color: colors.tealDark,
      marginBottom: 2,
    },
    brandSubtitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 13,
      color: colors.textMuted,
    },
    titleRow: {
      marginTop: spacing.xl,
      marginBottom: spacing.xl,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    title: {
      fontFamily: 'Inter-Bold', fontSize: 28, color: colors.tealDark,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: 'Inter-Regular', fontSize: 16, color: colors.tealMid,
    },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
      borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.tealDark,
      paddingHorizontal: spacing.lg, paddingVertical: 12,
      gap: spacing.md, marginBottom: spacing.xl,
    },
    searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 16, color: colors.textDark },
    monthlyCard: {
      backgroundColor: colors.tealMid, borderRadius: radius.lg,
      paddingVertical: spacing.xxl, paddingHorizontal: spacing.xxl,
      marginBottom: spacing.xl,
    },
    monthlyLabel: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#FFFFFF', marginBottom: spacing.sm },
    monthlyAmount: { fontFamily: 'Inter-Bold', fontSize: 44, color: '#FFFFFF' },
    cardsList: { gap: spacing.md, paddingRight: spacing.lg, marginBottom: spacing.xl },
    subCard: {
      backgroundColor: colors.card, borderRadius: radius.lg,
      padding: spacing.lg, width: 180, gap: spacing.sm,
    },
    subCardGrid: {
      width: undefined,
      flexGrow: 1,
      flexBasis: '23%',
      minWidth: 180,
      maxWidth: 280,
    },
    cardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.xl,
      marginBottom: spacing.xl,
      alignItems: 'stretch',
    },
    summaryColumn: {
      flex: 1,
      minWidth: 0,
    },
    subCardName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textDark, marginTop: 4 },
    subCardPrice: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textDark },
    subCardDays: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.tealMid },
    renewalsBtn: {
      backgroundColor: colors.tealLight, borderRadius: radius.lg,
      paddingVertical: 20, paddingHorizontal: spacing.xl,
      marginTop: spacing.sm,
    },
    renewalsBtnTitle: {
      fontFamily: 'Inter-SemiBold', fontSize: 18, color: '#FFFFFF',
      textAlign: 'center', marginBottom: 12,
    },
    renewalItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)',
    },
    renewalItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    renewalItemName: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF' },
    renewalItemDays: { fontFamily: 'Inter-Bold', fontSize: 13 },
  });

  const renderSubCard = (item: Subscription) => {
    const days = daysUntil(item.renewal_date);
    const cycleLabel = item.billing_cycle === 'monthly' ? 'Month' : 'Year';
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.subCard,
          isDesktopWeb && isLaptop && styles.subCardGrid,
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => router.push(`/add-subscription?id=${item.id}`)}>
        <ServiceLogo name={item.name} size={48} />
        <Text style={styles.subCardName}>{item.name}</Text>
        <Text style={styles.subCardPrice}>
          {sym}{Number(item.price)}/{cycleLabel}
        </Text>
        <Text style={styles.subCardDays}>
          {days < 0
            ? 'Overdue'
            : days === 0
              ? 'Today'
              : days === 1
                ? '1 Day left'
                : `${days} Days left`}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        contentContainerStyle={styles.scroll}>
        {isMobile ? (
          <View style={styles.brandHeader}>
            <Text style={styles.brandTitle}>Zubtrah</Text>
            <Text style={styles.brandSubtitle}>Subscription Reminder</Text>
          </View>
        ) : null}
        <View style={[styles.titleRow, isMobile && { marginTop: spacing.sm }]}>
          <View style={{ flex: 1 }}>
            {!isMobile ? (
              <Text style={styles.title}>Subscription Reminder</Text>
            ) : null}
            <Text style={styles.subtitle}>Welcome Back, {settings.userName}</Text>
          </View>
          <ProfileAvatar
            photoUri={settings.userPhoto}
            name={settings.userName}
            size={44}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>

        <View style={styles.searchWrap}>
          <Search size={20} color={colors.tealDark} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isDesktopWeb && isLaptop ? (
          <View style={styles.summaryRow}>
            <View style={[styles.monthlyCard, styles.summaryColumn, { marginBottom: 0 }]}>
              <Text style={styles.monthlyLabel}>Monthly Spends</Text>
              <Text style={styles.monthlyAmount}>
                {sym}{Math.round(monthlyTotal).toLocaleString()}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.renewalsBtn, styles.summaryColumn, { marginTop: 0 }, pressed && { opacity: 0.9 }]}
              onPress={() => router.push('/(tabs)/renewals')}>
              <Text style={styles.renewalsBtnTitle}>Upcoming Renewals</Text>
              {top3.length === 0 ? (
                <Text style={[styles.renewalItemName, { paddingVertical: spacing.lg, textAlign: 'center', color: colors.textMuted }]}>
                  No upcoming renewals
                </Text>
              ) : (
                top3.map((item) => {
                  const label = formatRenewalLabel(item.renewal_date);
                  const labelColor = daysLeftColor(item.renewal_date);
                  return (
                    <View key={item.id} style={styles.renewalItem}>
                      <View style={styles.renewalItemLeft}>
                        <ServiceLogo name={item.name} size={28} />
                        <Text style={styles.renewalItemName} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <Text style={[styles.renewalItemDays, { color: labelColor }]}>{label}</Text>
                    </View>
                  );
                })
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.monthlyCard}>
              <Text style={styles.monthlyLabel}>Monthly Spends</Text>
              <Text style={styles.monthlyAmount}>
                {sym}{Math.round(monthlyTotal).toLocaleString()}
              </Text>
            </View>
          </>
        )}

        {filtered.length > 0 && (
          isDesktopWeb && isLaptop ? (
            <View style={styles.cardsGrid}>
              {filtered.map((item) => renderSubCard(item))}
            </View>
          ) : (
            <FlatList
              data={filtered}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.cardsList}
              scrollEnabled
              renderItem={({ item }) => renderSubCard(item)}
            />
          )
        )}

        {!(isDesktopWeb && isLaptop) && (
          <Pressable
            style={({ pressed }) => [styles.renewalsBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/(tabs)/renewals')}>
            <Text style={styles.renewalsBtnTitle}>Upcoming Renewals</Text>
            {top3.length === 0 ? (
              <Text style={[styles.renewalItemName, { paddingVertical: spacing.lg, textAlign: 'center', color: colors.textMuted }]}>
                No upcoming renewals
              </Text>
            ) : (
              top3.map((item) => {
                const label = formatRenewalLabel(item.renewal_date);
                const labelColor = daysLeftColor(item.renewal_date);
                return (
                  <View key={item.id} style={styles.renewalItem}>
                    <View style={styles.renewalItemLeft}>
                      <ServiceLogo name={item.name} size={28} />
                      <Text style={styles.renewalItemName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <Text style={[styles.renewalItemDays, { color: labelColor }]}>{label}</Text>
                  </View>
                );
              })
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
