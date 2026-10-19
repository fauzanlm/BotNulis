import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TypographyConfig, HumanizerConfig, RealismConfig } from '@/types/style';

export const useStyleStore = defineStore(
  'style',
  () => {
    const typography = ref<TypographyConfig>({
      fontFamily: 'Font_Standard1',
      fontSize: 52,
      color: '#1b263b', // Deep ballpoint ink black/navy
      lineHeightScale: 1.0,
      letterSpacing: 1.0,
      wordSpacing: 1.0,
      baselineOffset: -6,
    });

    const humanizer = ref<HumanizerConfig>({
      enabled: true,
      baselineJitter: 0.45,       // organic subtle bounce
      rotationJitter: 0.35,       // gentle tilt
      spacingJitter: 0.4,         // natural word gaps
      marginDrift: 0.4,           // margin fatigue
      inkPressureVariance: 0.5,   // ink depth variance
      strikethroughStyle: 'scratch',
    });

    const realism = ref<RealismConfig>({
      enabled: true,
      shadowType: 'phone_top',
      shadowIntensity: 0.3,
      lightingTemperature: 'warm_lamp',
      lightingWarmth: 0.25,
      vignette: 0.25,
      perspectiveTilt: 0,
    });

    // Preset Profiles
    function applyPreset(name: 'pelajar_rapi' | 'cakar_ayam' | 'kamera_malam' | 'scan_bersih') {
      if (name === 'pelajar_rapi') {
        typography.value.fontFamily = 'Font_Standard1';
        typography.value.fontSize = 52;
        typography.value.color = '#1b263b';
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
