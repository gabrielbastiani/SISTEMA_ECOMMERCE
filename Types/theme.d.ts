// types/theme.d.ts
import { Theme } from '@/context/ThemeContext';

declare global {
  interface Window {
    __theme: Theme;
    __setPreferredTheme: (theme: Theme) => void;
  }
}