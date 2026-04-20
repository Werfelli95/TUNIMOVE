// ─── TuniMove Design System ────────────────────────────────────────────────
export const Colors = {
  // Brand
  primary: '#163A59',
  primaryLight: '#1F4B6E',
  accent: '#F5B700',
  accentDark: '#D4A000',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Neutrals
  bgLight: '#F4F6F8',
  bgMid: '#EDF0F3',
  white: '#FFFFFF',
  divider: '#E2E8F0',
  border: '#CBD5E1',

  // Text
  textDark: '#0F172A',
  textMid: '#334155',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',
};

export const Typography = {
  pageTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.textDark, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.textDark },
  cardTitle: { fontSize: 17, fontWeight: '800' as const, color: Colors.textDark },
  body: { fontSize: 16, fontWeight: '500' as const, color: Colors.textMid },
  bodyMedium: { fontSize: 16, fontWeight: '700' as const, color: Colors.textMid },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  caption: { fontSize: 14, fontWeight: '500' as const, color: Colors.textMuted },
  smallBold: { fontSize: 13, fontWeight: '800' as const, color: Colors.textMuted },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
};

export const Shadow = {
  card: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  strong: {
    shadowColor: '#163A59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  accent: {
    shadowColor: '#F5B700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
};
