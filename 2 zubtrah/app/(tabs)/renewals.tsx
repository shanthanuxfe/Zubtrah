import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceLogo } from '@/components/ServiceLogo';
import {
  supabase,
  type Subscription,
  daysUntil,
  formatRenewalLabel,
  daysLeftColor,
} from '@/lib/supabase';
import { useSettings, useThemeColors, getCurrencySymbol } from '@/hooks/useSettings';
import { usePageContentStyle, usePageWrapperStyle, useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing, radius } from '@/lib/theme';

type Filter = 'all' | 'week' | 'month';

export default function RenewalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const colors = useThemeColors();
  const { isDesktopWeb, showSidebar } = useResponsiveLayout();
  const pageWrapperStyle = usePageWrapperStyle();
  const pageContentStyle = usePageContentStyle({
    paddingHorizontal: spacing.xl,
    paddingBottom: showSidebar ? 48 : 100,
    gap: spacing.md,
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    setRefreshing(silent);
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .order('renewal_date', { ascending: true });
    setSubscriptions((data ?? []) as Subscription[]);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = subscriptions.filter((s) => {
    const days = daysUntil(s.renewal_date);
    if (filter === 'week') return days >= 0 && days <= 7;
    if (filter === 'month') return days >= 0 && days <= 31;
    return true;
  });

  const sym = getCurrencySymbol(settings.currency);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    page: pageWrapperStyle,
    headerWrap: {
      paddingHorizontal: isDesktopWeb ? 0 : spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      alignItems: isDesktopWeb ? 'flex-start' : 'center',
    },
    title: {
      fontFamily: 'Inter-Bold', fontSize: 26, color: colors.tealDark,
      textAlign: isDesktopWeb ? 'left' : 'center',
    },
    subtitle: {
      fontFamily: 'Inter-Regular', fontSize: 15, color: colors.tealMid,
      marginTop: 4, textAlign: isDesktopWeb ? 'left' : 'center',
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: isDesktopWeb ? 0 : spacing.xl,
      gap: spacing.md,
      paddingBottom: spacing.lg,
      ...(isDesktopWeb ? { justifyContent: 'flex-start' } : {}),
    },
    filterTab: {
      paddingVertical: 10, paddingHorizontal: spacing.lg, borderRadius: radius.md,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    filterTabActive: { backgroundColor: colors.tealDark, borderColor: colors.tealDark },
    filterTabText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.tealDark },
    filterTabTextActive: { color: '#FFFFFF' },
    list: isDesktopWeb
      ? { paddingBottom: showSidebar ? 48 : 100, gap: spacing.md }
      : pageContentStyle,
    card: {
      backgroundColor: colors.card, borderRadius: radius.lg,
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.md,
    },
    cardInfo: { flex: 1, gap: 4 },
    cardName: { fontFamily: 'Inter-Bold', fontSize: 16, color: colors.textDark },
    cardPrice: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textDark },
    daysLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontFamily: 'Inter-Bold', fontSize: 18, color: colors.tealDark, marginBottom: 6 },
    emptySubText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textMuted },
  });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.page}>
        <View style={s.headerWrap}>
          <Text style={s.title}>Upcoming Renewals</Text>
          <Text style={s.subtitle}>Track all upcoming payments</Text>
        </View>

        <View style={s.filterRow}>
          {(['all', 'week', 'month'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}>
              <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                {f === 'all' ? 'All' : f === 'week' ? 'This week' : 'This Month'}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No subscriptions yet</Text>
              <Text style={s.emptySubText}>Tap the + button to add one</Text>
            </View>
          }
          renderItem={({ item }) => {
            const label = formatRenewalLabel(item.renewal_date);
            const labelColor = daysLeftColor(item.renewal_date);
            const cycleLabel = item.billing_cycle === 'monthly' ? 'Month' : 'Year';
            return (
              <Pressable
                style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
                onPress={() => router.push(`/add-subscription?id=${item.id}`)}>
                <ServiceLogo name={item.name} size={54} />
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardPrice}>
                    {sym}{Number(item.price)}/{cycleLabel}
                  </Text>
                </View>
                <Text style={[s.daysLabel, { color: labelColor }]}>{label}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}
