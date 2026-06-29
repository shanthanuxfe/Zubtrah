import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions, type ViewStyle } from 'react-native';

export const BREAKPOINTS = {
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
} as const;

const SIDEBAR_WIDTH = 240;

/** True on native iOS/Android and on narrow/coarse-pointer mobile web. */
function useIsMobileLayout() {
  const [isMobileWeb, setIsMobileWeb] = useState(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse) and (max-width: 820px)').matches;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse) and (max-width: 820px)');
    const update = () => setIsMobileWeb(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return Platform.OS !== 'web' || isMobileWeb;
}

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isMobile = useIsMobileLayout();
  const isDesktopWeb = Platform.OS === 'web' && !isMobile;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLaptop = width >= BREAKPOINTS.laptop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const showSidebar = isDesktopWeb && isLaptop;

  const contentMaxWidth = isDesktop ? 1200 : isLaptop ? 960 : isTablet ? 720 : undefined;
  const horizontalPadding = isDesktop ? 40 : isLaptop ? 32 : isTablet ? 28 : undefined;

  return {
    width,
    isMobile,
    isDesktopWeb,
    isTablet,
    isLaptop,
    isDesktop,
    showSidebar,
    sidebarWidth: SIDEBAR_WIDTH,
    contentMaxWidth,
    horizontalPadding,
  };
}

/** Full-width page shell for screens that aren't a single ScrollView. */
export function usePageWrapperStyle(): ViewStyle {
  const { isDesktopWeb, contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  if (!isDesktopWeb) {
    return { flex: 1 };
  }

  return {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    ...(contentMaxWidth ? { maxWidth: contentMaxWidth } : {}),
    ...(horizontalPadding != null ? { paddingHorizontal: horizontalPadding } : {}),
  };
}

/** Applies centered max-width containers on desktop web only; mobile styles pass through unchanged. */
export function usePageContentStyle(baseStyle?: ViewStyle): ViewStyle {
  const { isDesktopWeb, contentMaxWidth, showSidebar, horizontalPadding } = useResponsiveLayout();

  if (!isDesktopWeb) {
    return baseStyle ?? {};
  }

  return {
    ...baseStyle,
    width: '100%',
    alignSelf: 'center',
    ...(contentMaxWidth ? { maxWidth: contentMaxWidth } : {}),
    ...(horizontalPadding != null
      ? { paddingHorizontal: horizontalPadding }
      : {}),
    ...(showSidebar && baseStyle?.paddingBottom === 100
      ? { paddingBottom: 48 }
      : showSidebar && baseStyle?.paddingBottom == null
        ? { paddingBottom: 48 }
        : {}),
  };
}
