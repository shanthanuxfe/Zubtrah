export const lightColors = {
  bg: '#E8E4DC',
  card: '#FFFFFF',
  tealDark: '#1A6B5A',
  tealMid: '#2D8B75',
  tealLight: '#7EC8B8',
  tealFaint: '#E0F0EC',
  textPrimary: '#1A6B5A',
  textDark: '#1A1A1A',
  textSecondary: '#4A7A6D',
  textMuted: '#7A9990',
  tabIcon: '#5A8A7A',
  border: '#D8D4CC',
  divider: '#F0EDE8',
  errorRed: '#CC3333',
  white: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBorder: '#E0DDD6',
  inputBg: '#FFFFFF',
  dropdownBg: '#E8E6E0',
  dropdownMenuBg: '#FFFFFF',
  shadow: '#000000',
};

export const darkColors = {
  bg: '#0F1A18',
  card: '#1C2B28',
  tealDark: '#4DBFA0',
  tealMid: '#3DA888',
  tealLight: '#5ABFAA',
  tealFaint: '#1A3330',
  textPrimary: '#4DBFA0',
  textDark: '#E8E4DC',
  textSecondary: '#8ECFC2',
  textMuted: '#4A7A6D',
  tabIcon: '#4A7A6D',
  border: '#2A4038',
  divider: '#1E3330',
  errorRed: '#FF6B6B',
  white: '#E8E4DC',
  tabBar: '#111E1C',
  tabBorder: '#1E3330',
  inputBg: '#1C2B28',
  dropdownBg: '#243530',
  dropdownMenuBg: '#1C2B28',
  shadow: '#000000',
};

export type AppColors = typeof lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

// Default export for backwards compat — screens use useTheme() instead
export const colors = lightColors;
export const theme = { colors: lightColors, spacing, radius };
export type Theme = typeof theme;
