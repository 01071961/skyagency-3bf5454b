/**
 * Responsive Tailwind Class Mappings
 * 
 * Tailwind CSS requires classes to be statically analyzable at build time.
 * Dynamic string interpolation like `grid-cols-${n}` won't work because
 * the full class name must exist in the source code for Tailwind to include it.
 * 
 * This file provides mapping objects for all dynamic class patterns.
 */

// Grid columns mapping
export const GRID_COLS: Record<number | string, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

// Text alignment mapping
export const TEXT_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

// Gap sizes mapping
export const GAP_SIZES: Record<string, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2 md:gap-3',
  small: 'gap-2 md:gap-4',
  md: 'gap-4 md:gap-6',
  medium: 'gap-4 md:gap-6',
  lg: 'gap-6 md:gap-8',
  large: 'gap-6 md:gap-10',
  xl: 'gap-8 md:gap-12',
};

// Padding sizes mapping
export const PADDING_SIZES: Record<string, string> = {
  none: 'py-0',
  xs: 'py-2',
  sm: 'py-4 md:py-6',
  small: 'py-8',
  md: 'py-8 md:py-12',
  medium: 'py-12 md:py-16',
  lg: 'py-12 md:py-20',
  large: 'py-16 md:py-24',
  xl: 'py-20 md:py-32',
};

// Column layouts mapping
export const COLUMN_LAYOUTS: Record<string, string> = {
  '50-50': 'grid-cols-1 md:grid-cols-2',
  '60-40': 'grid-cols-1 md:grid-cols-[60fr_40fr]',
  '40-60': 'grid-cols-1 md:grid-cols-[40fr_60fr]',
  '70-30': 'grid-cols-1 md:grid-cols-[70fr_30fr]',
  '30-70': 'grid-cols-1 md:grid-cols-[30fr_70fr]',
  '33-33-33': 'grid-cols-1 md:grid-cols-3',
  '25-50-25': 'grid-cols-1 md:grid-cols-[1fr_2fr_1fr]',
  '25-25-25-25': 'grid-cols-2 md:grid-cols-4',
};

// Vertical alignment mapping
export const VERTICAL_ALIGN: Record<string, string> = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
  stretch: 'items-stretch',
};

// Horizontal alignment mapping
export const HORIZONTAL_ALIGN: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

// Border radius mapping
export const BORDER_RADIUS: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

// Shadow mapping
export const SHADOWS: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

// Font sizes mapping
export const FONT_SIZES: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

// Font weights mapping
export const FONT_WEIGHTS: Record<string, string> = {
  thin: 'font-thin',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

// Aspect ratios
export const ASPECT_RATIOS: Record<string, string> = {
  auto: 'aspect-auto',
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-video',
  '21/9': 'aspect-[21/9]',
};

// Max width mapping
export const MAX_WIDTHS: Record<string, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
  none: 'max-w-none',
};

// Container widths
export const CONTAINER_WIDTHS: Record<string, string> = {
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

// Helper function to safely get class from mapping
export function getResponsiveClass<T extends Record<string, string>>(
  mapping: T,
  key: string | number | undefined | null,
  fallback: keyof T
): string {
  if (key === undefined || key === null) {
    return mapping[fallback] || '';
  }
  return mapping[key] || mapping[fallback] || '';
}
