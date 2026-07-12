/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── TransitOps Design System ─────────────────────────────────────
        brand: {
          DEFAULT: '#0F766E',
          hover:   '#115E59',
          light:   '#CCFBF1',
          muted:   '#F0FDFA',
        },
        surface: {
          DEFAULT: '#F5F7FA',
          card:    '#FFFFFF',
          sidebar: '#F8FAFC',
        },
        text: {
          primary:   '#111827',
          secondary: '#6B7280',
          muted:     '#9CA3AF',
          inverse:   '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong:  '#D1D5DB',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger:  '#DC2626',
          info:    '#2563EB',
          'success-bg': '#F0FDF4',
          'warning-bg': '#FFFBEB',
          'danger-bg':  '#FEF2F2',
          'info-bg':    '#EFF6FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
        modal:  '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        DEFAULT: '0.375rem', // 6px — enterprise, not rounded
      },
      spacing: {
        sidebar: '240px',
        navbar:  '60px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
