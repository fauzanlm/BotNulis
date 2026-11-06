export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeightScale: number;
  letterSpacing: number;
  wordSpacing: number;
  baselineOffset: number;
}

export interface HumanizerConfig {
  enabled: boolean;
  baselineJitter: number;      // 0.0 to 1.0 (maps to 0 to 4px)
  rotationJitter: number;      // 0.0 to 1.0 (maps to -1.5deg to +1.5deg)
  spacingJitter: number;       // 0.0 to 1.0
  marginDrift: number;         // 0.0 to 1.0 (margin indent fatigue down lines)
  inkPressureVariance: number; // 0.0 to 1.0 (opacity variance)
  strikethroughStyle: 'scratch' | 'single' | 'double';
}

export interface RealismConfig {
  enabled: boolean;
  shadowType: 'none' | 'phone_top' | 'phone_corner' | 'window_blind';
  shadowIntensity: number;     // 0.0 to 1.0
  lightingTemperature: 'neutral' | 'warm_lamp' | 'cool_daylight';
  lightingWarmth: number;      // 0.0 to 1.0
  vignette: number;            // 0.0 to 1.0
  perspectiveTilt: number;     // 0 to 15 degrees
}

export interface HeaderConfig {
  name: string;
  date: string;
  subject: string;
  pageNumber: string;
}

export type ColumnPresetKey = 'vocab' | 'equal' | 'comparison' | 'custom';

export interface ColumnConfig {
  enabled: boolean;
  preset: ColumnPresetKey;
  ratios: [number, number, number]; // e.g. [0.15, 0.35, 0.50]
  showDividers: boolean;            // Draw vertical column divider line
  gap: number;                      // Gap between columns in px
}
