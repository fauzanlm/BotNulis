import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TypographyConfig, HumanizerConfig, RealismConfig } from '@/types/style';

export type PresetProfileKey =
  | 'sangat_rapi'
  | 'estetik_study'
  | 'arsitek_presisi'
  | 'tegak_bersambung'
  | 'pelajar_rapi'
  | 'cakar_ayam'
  | 'kamera_malam'
  | 'scan_bersih';

export const useStyleStore = defineStore(
  'style',
  () => {
    const typography = ref<TypographyConfig>({
      fontFamily: 'PatrickHand', // Default to ultra-neat font
      fontSize: 50,
      color: '#1b3b6f', // Deep pilot navy ink
      lineHeightScale: 1.0,
      letterSpacing: 1.0,
      wordSpacing: 1.0,
      baselineOffset: -4,
    });

    const humanizer = ref<HumanizerConfig>({
      enabled: true,
      baselineJitter: 0.3,       // subtle neat bounce
      rotationJitter: 0.2,       // subtle tilt
      spacingJitter: 0.25,       // consistent word gaps
      marginDrift: 0.2,          // disciplined straight margin
      inkPressureVariance: 0.4,  // natural ink saturation
      strikethroughStyle: 'scratch',
    });

    const realism = ref<RealismConfig>({
      enabled: true,
      shadowType: 'phone_top',
      shadowIntensity: 0.25,
      lightingTemperature: 'warm_lamp',
      lightingWarmth: 0.2,
      vignette: 0.2,
      perspectiveTilt: 0,
    });

    // Preset Profiles
    function applyPreset(name: PresetProfileKey) {
      if (name === 'sangat_rapi') {
        typography.value.fontFamily = 'PatrickHand';
        typography.value.fontSize = 50;
        typography.value.color = '#1b3b6f'; // Biru Pilot
        typography.value.baselineOffset = -4;
        humanizer.value.baselineJitter = 0.25;
        humanizer.value.rotationJitter = 0.18;
        humanizer.value.spacingJitter = 0.25;
        humanizer.value.marginDrift = 0.2;
        humanizer.value.inkPressureVariance = 0.35;
        realism.value.shadowType = 'phone_top';
        realism.value.shadowIntensity = 0.2;
        realism.value.lightingTemperature = 'warm_lamp';
        realism.value.lightingWarmth = 0.2;
      } else if (name === 'estetik_study') {
        typography.value.fontFamily = 'Mali';
        typography.value.fontSize = 48;
        typography.value.color = '#1b263b';
        typography.value.baselineOffset = -5;
        humanizer.value.baselineJitter = 0.3;
        humanizer.value.rotationJitter = 0.2;
        humanizer.value.spacingJitter = 0.3;
        humanizer.value.marginDrift = 0.2;
        realism.value.shadowType = 'phone_top';
        realism.value.shadowIntensity = 0.3;
        realism.value.lightingTemperature = 'warm_lamp';
        realism.value.lightingWarmth = 0.35;
      } else if (name === 'arsitek_presisi') {
        typography.value.fontFamily = 'ArchitectsDaughter';
        typography.value.fontSize = 46;
        typography.value.color = '#111827';
        typography.value.baselineOffset = -4;
        humanizer.value.baselineJitter = 0.15;
        humanizer.value.rotationJitter = 0.12;
        humanizer.value.spacingJitter = 0.2;
        humanizer.value.marginDrift = 0.15;
        realism.value.shadowType = 'none';
        realism.value.shadowIntensity = 0;
        realism.value.lightingTemperature = 'neutral';
        realism.value.lightingWarmth = 0;
      } else if (name === 'tegak_bersambung') {
        typography.value.fontFamily = 'MarckScript';
        typography.value.fontSize = 54;
        typography.value.color = '#1b3b6f';
        typography.value.baselineOffset = -6;
        humanizer.value.baselineJitter = 0.35;
        humanizer.value.rotationJitter = 0.25;
        humanizer.value.spacingJitter = 0.3;
        humanizer.value.marginDrift = 0.25;
      } else if (name === 'pelajar_rapi') {
        typography.value.fontFamily = 'Font_Standard1';
        typography.value.fontSize = 52;
        typography.value.color = '#1b263b';
        typography.value.baselineOffset = -6;
        humanizer.value.baselineJitter = 0.3;
        humanizer.value.rotationJitter = 0.2;
        humanizer.value.spacingJitter = 0.3;
        humanizer.value.marginDrift = 0.25;
        realism.value.shadowType = 'phone_top';
        realism.value.shadowIntensity = 0.25;
        realism.value.lightingTemperature = 'warm_lamp';
      } else if (name === 'cakar_ayam') {
        typography.value.fontFamily = 'Ugly_Handwriting';
        typography.value.fontSize = 58;
        typography.value.color = '#111827';
        typography.value.baselineOffset = -6;
        humanizer.value.baselineJitter = 0.75;
        humanizer.value.rotationJitter = 0.65;
        humanizer.value.spacingJitter = 0.6;
        humanizer.value.marginDrift = 0.6;
      } else if (name === 'kamera_malam') {
        realism.value.enabled = true;
        realism.value.shadowType = 'phone_top';
        realism.value.shadowIntensity = 0.5;
        realism.value.lightingTemperature = 'warm_lamp';
        realism.value.lightingWarmth = 0.45;
        realism.value.vignette = 0.4;
      } else if (name === 'scan_bersih') {
        realism.value.shadowType = 'none';
        realism.value.shadowIntensity = 0;
        realism.value.lightingTemperature = 'neutral';
        realism.value.lightingWarmth = 0;
        realism.value.vignette = 0;
      }
    }

    return {
      typography,
      humanizer,
      realism,
      applyPreset,
    };
  },
  {
    persist: true,
  }
);
