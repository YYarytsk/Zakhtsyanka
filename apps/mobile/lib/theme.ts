// Design tokens — mirrors the web app's amber/stone palette
export const colors = {
  amber:      { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
  stone:      { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 400: '#a8a29e', 500: '#78716c', 700: '#44403c', 900: '#1c1917' },
  white:      '#ffffff',
  green:      { 100: '#dcfce7', 500: '#22c55e', 700: '#15803d' },
  red:        { 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626' },
  background: '#fafaf9',
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
}

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
}

export const typography = {
  xs:   { fontSize: 11, lineHeight: 16 },
  sm:   { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg:   { fontSize: 17, lineHeight: 24 },
  xl:   { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
}
