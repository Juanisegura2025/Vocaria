import { theme } from 'antd';

// Custom theme configuration for Ant Design
export const antdTheme = {
  token: {
    // Colors
    colorPrimary: 'var(--primary)',
    colorSuccess: 'var(--success)',
    colorWarning: 'var(--warning)',
    colorError: 'var(--error)',
    colorInfo: 'var(--primary)',
    
    // Typography
    fontFamily: 'var(--font-primary)',
    fontSize: 14,
    
    // Border Radius
    borderRadius: 8,
    borderRadiusSM: 4,
    borderRadiusLG: 12,
    
    // Spacing
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 48,
    
    // Components
    controlOutline: 'rgba(37, 99, 235, 0.1)',
    controlOutlineWidth: 2,
  },
  components: {
    Button: {
      primaryColor: '#fff',
      fontWeight: 'var(--weight-medium)',
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,
      paddingInline: 20,
      paddingInlineSM: 16,
      paddingInlineLG: 24,
    },
    Input: {
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,
      paddingInline: 16,
      paddingBlock: 8,
      activeBorderColor: 'var(--primary)',
      hoverBorderColor: 'var(--primary-light)',
      activeShadow: '0 0 0 2px var(--primary-50)',
    },
    Card: {
      paddingLG: 24,
      paddingMD: 16,
      paddingSM: 12,
      borderRadiusLG: 12,
      boxShadowTertiary: 'var(--shadow-sm)',
    },
    Menu: {
      itemActiveBg: 'var(--primary-50)',
      itemSelectedBg: 'var(--primary-50)',
      itemSelectedColor: 'var(--primary)',
      itemHoverBg: 'var(--gray-50)',
      itemHoverColor: 'var(--primary-light)',
    },
    Table: {
      headerBg: 'var(--gray-50)',
      headerColor: 'var(--gray-700)',
      headerSplitColor: 'transparent',
      rowHoverBg: 'var(--gray-50)',
      borderColor: 'var(--gray-200)',
    },
  },
  algorithm: theme.defaultAlgorithm,
};
