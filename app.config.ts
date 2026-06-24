import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * SelfLab — private, single-user health & fitness companion.
 * Dynamic config so secrets (Google Maps key) come from the environment and
 * never get committed. Native modules are wired through config plugins so a
 * single `eas build` produces a working dev client.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SelfLab',
  slug: 'selflab',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'selflab',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0A0B0E',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.selflab.app',
    infoPlist: {
      NSHealthShareUsageDescription: 'SelfLab reads your health data to coach you.',
      NSHealthUpdateUsageDescription: 'SelfLab writes workouts and metrics to Health.',
    },
  },
  android: {
    package: 'com.selflab.app',
    adaptiveIcon: {
      backgroundColor: '#0A0B0E',
    },
    permissions: [
      'ACTIVITY_RECOGNITION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
  web: {
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A0B0E',
        imageWidth: 120,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'SelfLab uses your location to track runs, walks and rides.',
        locationWhenInUsePermission: 'SelfLab uses your location to track your activity.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-sensors',
      { motionPermission: 'SelfLab uses motion to count your steps and activity.' },
    ],
    [
      'expo-camera',
      { cameraPermission: 'SelfLab uses the camera to scan barcodes and capture meals.' },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'SelfLab uses your photos for meals and progress pictures.' },
    ],
    [
      'expo-calendar',
      { calendarPermission: 'SelfLab reads your calendar to plan workouts around your day.' },
    ],
    [
      'expo-notifications',
      { color: '#BFF53C' },
    ],
    'expo-local-authentication',
    'react-native-health-connect',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 26,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      // projectId is injected by `eas init`
    },
  },
});
