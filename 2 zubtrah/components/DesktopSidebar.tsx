import { useRouter, usePathname } from 'expo-router';
import { Home, Bell, Settings, User, Plus } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/hooks/useSettings';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { spacing, radius } from '@/lib/theme';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, paths: ['/', '/index'] },
  { href: '/renewals', label: 'Renewals', icon: Bell, paths: ['/renewals'] },
  { href: '/settings', label: 'Settings', icon: Settings, paths: ['/settings'] },
  { href: '/profile', label: 'Profile', icon: User, paths: ['/profile'] },
] as const;

function isActiveRoute(pathname: string, paths: readonly string[]) {
  if (paths.includes('/')) {
    return pathname === '/' || pathname === '/index' || pathname.endsWith('/index');
  }
  return paths.some((p) => pathname === p || pathname.endsWith(p));
}

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();
  const { showSidebar, sidebarWidth } = useResponsiveLayout();

  if (Platform.OS !== 'web' || !showSidebar) {
    return null;
  }

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          backgroundColor: colors.tabBar,
          borderRightColor: colors.tabBorder,
        },
      ]}>
      <View style={styles.brand}>
        <Text style={[styles.brandTitle, { color: colors.tealDark }]}>Zubtrah</Text>
        <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
          Subscription Reminder
        </Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, paths }) => {
          const active = isActiveRoute(pathname, paths);
          return (
            <Pressable
              key={href}
              style={({ pressed }) => [
                styles.navItem,
                {
                  backgroundColor: active ? colors.tealFaint : 'transparent',
                  borderColor: active ? colors.tealDark : 'transparent',
                },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Icon
                size={20}
                color={active ? colors.tealDark : colors.tabIcon}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: active ? colors.tealDark : colors.textSecondary },
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.tealDark },
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push('/add-subscription')}
          accessibilityRole="button">
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Subscription</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'flex-start',
  },
  brand: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  brandTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  nav: {
    gap: spacing.sm,
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  navLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  footer: {
    paddingTop: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
