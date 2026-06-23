import { Tabs, useRouter } from 'expo-router';
import { Home, Bell, Settings, User } from 'lucide-react-native';
import { Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { useThemeColors } from '@/hooks/useSettings';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function FabButton() {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.tealDark }]}
      onPress={() => router.push('/add-subscription')}
      activeOpacity={0.85}>
      <Text style={[styles.fabPlus, { color: '#FFFFFF' }]}>+</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { showSidebar } = useResponsiveLayout();
  // Reserve bottom space on mobile web for the hosting badge ("Made in Bolt"
  // etc.) so it can't overlap the tab icons. On native we just use the
  // safe-area inset; on iOS that's already correct, on Android it's usually 0.
  const isMobileWeb = Platform.OS === 'web' && typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse) and (max-width: 820px)').matches;
  const hostingBadgeGap = isMobileWeb ? 36 : 0;
  const bottomInset = Math.max(insets.bottom, hostingBadgeGap);
  const tabBarHeight = 64 + bottomInset;

  return (
    <View style={styles.shell}>
      <DesktopSidebar />
      <View style={styles.main}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarActiveTintColor: colors.tealDark,
            tabBarInactiveTintColor: colors.tabIcon,
            tabBarStyle: showSidebar
              ? { display: 'none' }
              : [
                  styles.tabBar,
                  {
                    height: tabBarHeight,
                    paddingBottom: bottomInset,
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBorder,
                  },
                ],
            tabBarItemStyle: styles.tabItem,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Home size={size + 2} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tabs.Screen
            name="renewals"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Bell size={size + 2} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tabs.Screen
            name="__fab"
            options={{
              tabBarIcon: () => null,
              tabBarButton: () => (
                <View style={styles.fabWrap}>
                  <FabButton />
                </View>
              ),
            }}
            listeners={{ tabPress: (e) => e.preventDefault() }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Settings size={size + 2} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color, size }) => (
                <User size={size + 2} color={color} strokeWidth={2} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  tabBar: {
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -2,
  },
});
