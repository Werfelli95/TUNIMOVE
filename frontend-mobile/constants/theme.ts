import { Platform } from 'react-native';

/**
 * TUNIMOVE Ultra-Premium Design System
 * Focus: Glassmorphism, Deep Obsidian, Electric Indigo, and Layered Depth.
 */

export const Colors = {
  // Brand Colors - High Contrast & Luxury
  primary: '#0F172A',      // Deep Obsidian
  primaryLight: '#1E293B', // Slate Navy
  accent: '#FACC15',       // Electric Gold (Amber-Yellow)
  accentLight: '#FEF08A',  // Soft Gold
  
  // Semantic Colors - Vibrant but Sophisticated
  success: '#10B981',      // Emerald
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Amber
  warningLight: '#FEF3C7',
  danger: '#EF4444',       // Rose Red
  dangerLight: '#FEE2E2',
  info: '#3B82F6',         // Modern Blue
  infoLight: '#DBEAFE',

  // Neutrals - Ultra Clean
  white: '#FFFFFF',
  bgLight: '#F8FAFC',      // Ghost White
  bgMid: '#F1F5F9',        // Light Slate
  textDark: '#020617',     // Black Pearl
  textMid: '#334155',      // Slate Gray
  textMuted: '#64748B',    // Steel Gray
  textLight: '#94A3B8',    // Silver Slate
  border: '#E2E8F0',       // Soft Border
  divider: '#F1F5F9',
  
  // Glassmorphism & Overlay
  glass: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(15, 23, 42, 0.8)',
  overlay: 'rgba(2, 6, 17, 0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
};

/**
 * Premium Layered Shadows
 * Designed for both Web (boxShadow) and Native (elevation/shadowOffset)
 */
export const Shadow = {
  subtle: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    }),
  },
  card: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)' },
    }),
  },
  strong: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' },
    }),
  },
  accent: {
    ...Platform.select({
      ios: { shadowColor: '#FACC15', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 6 },
      web: { boxShadow: '0 10px 20px -5px rgba(250, 204, 21, 0.3)' },
    }),
  },
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  body: { fontSize: 16, color: Colors.textMid, lineHeight: 24 },
  label: { fontSize: 12, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  caption: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
};
