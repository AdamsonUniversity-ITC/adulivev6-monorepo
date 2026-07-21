export const T = {
    dark: {
        titleColor: '#f0f6ff',
        subColor: '#a8c4f0',

        cardBg: 'rgba(11,19,40,0.96)',
        cardBorder: 'rgba(100,160,255,0.30)',
        cardShadow: '0 4px 40px rgba(37,99,235,0.22)',
        cardHeaderBg: 'rgba(7,14,32,0.98)',
        cardHeaderBorder: 'rgba(100,160,255,0.22)',
        sectionDivider: 'rgba(100,160,255,0.14)',

        tableHeadBg: 'rgba(10,22,50,0.90)',
        tableHeadText: '#7eb8ff',
        tableHeadBorder: 'rgba(100,160,255,0.26)',
        rowBorder: 'rgba(100,160,255,0.11)',
        rowEvenBg: 'rgba(13,26,58,0.32)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(59,130,246,0.09)',

        cellText: '#ddeeff',
        cellMuted: '#7a9cc4',
        cellBlue: '#60a5fa',
        cellGreen: '#4ade80',
        cellAmber: '#fbbf24',

        btnRefresh: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(100,160,255,0.45)', text: '#7eb8ff', hover: 'rgba(59,130,246,0.30)' },
        btnPrimary: { bg: 'rgba(59,130,246,0.14)', border: 'rgba(100,160,255,0.38)', text: '#93c5fd', hover: 'rgba(59,130,246,0.26)' },

        inputBg: 'rgba(13,26,58,0.85)',
        inputBorder: 'rgba(100,160,255,0.32)',
        inputText: '#e8f0fe',
        inputPlaceholder: '#5a7ca8',

        dropdownBg: 'rgba(10,18,42,0.98)',
        dropdownHover: 'rgba(59,130,246,0.08)',
        dropdownSelected: 'rgba(59,130,246,0.12)',

        accentColor: '#60a5fa',
        checkboxBorder: 'rgba(100,160,255,0.32)',
        dividerColor: 'rgba(100,160,255,0.14)',
        dividerInlineColor: 'rgba(100,160,255,0.18)',
        sectionDividerColor: 'rgba(100,160,255,0.10)',
        labelColor: '#5a7ca8',
    },
    light: {
        titleColor: '#0a1628',
        subColor: '#2d4a7a',

        cardBg: 'rgba(255,255,255,0.99)',
        cardBorder: 'rgba(37,99,235,0.22)',
        cardShadow: '0 4px 32px rgba(0,48,135,0.12)',
        cardHeaderBg: 'rgba(240,246,255,0.99)',
        cardHeaderBorder: 'rgba(37,99,235,0.18)',
        sectionDivider: 'rgba(37,99,235,0.10)',

        tableHeadBg: 'rgba(210,228,255,0.95)',
        tableHeadText: '#1440a8',
        tableHeadBorder: 'rgba(37,99,235,0.22)',
        rowBorder: 'rgba(37,99,235,0.09)',
        rowEvenBg: 'rgba(232,242,255,0.60)',
        rowOddBg: 'transparent',
        rowHoverBg: 'rgba(219,234,254,0.55)',

        cellText: '#0a1628',
        cellMuted: '#2d4a7a',
        cellBlue: '#1440a8',
        cellGreen: '#047857',
        cellAmber: '#b45309',

        btnRefresh: { bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.35)', text: '#1d4ed8', hover: 'rgba(37,99,235,0.18)' },
        btnPrimary: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.32)', text: '#1d4ed8', hover: 'rgba(37,99,235,0.16)' },

        inputBg: 'rgba(232,242,255,0.95)',
        inputBorder: 'rgba(37,99,235,0.28)',
        inputText: '#0a1628',
        inputPlaceholder: '#7a9cc4',

        dropdownBg: 'rgba(255,255,255,0.99)',
        dropdownHover: 'rgba(37,99,235,0.05)',
        dropdownSelected: 'rgba(37,99,235,0.08)',

        accentColor: '#1d4ed8',
        checkboxBorder: 'rgba(37,99,235,0.32)',
        dividerColor: 'rgba(37,99,235,0.12)',
        dividerInlineColor: 'rgba(37,99,235,0.18)',
        sectionDividerColor: 'rgba(37,99,235,0.09)',
        labelColor: '#4a6a9a',
    },
};

export type Theme = typeof T.dark;