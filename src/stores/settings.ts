import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  biometricLock: boolean;
  notificationsEnabled: boolean;
  healthConnectEnabled: boolean;
  proactiveCoach: boolean;
  hapticsEnabled: boolean;
  setBiometricLock: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setHealthConnectEnabled: (v: boolean) => void;
  setProactiveCoach: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      biometricLock: false,
      notificationsEnabled: true,
      healthConnectEnabled: false,
      proactiveCoach: true,
      hapticsEnabled: true,
      setBiometricLock: (v) => set({ biometricLock: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setHealthConnectEnabled: (v) => set({ healthConnectEnabled: v }),
      setProactiveCoach: (v) => set({ proactiveCoach: v }),
      setHaptics: (v) => set({ hapticsEnabled: v }),
    }),
    { name: 'selflab-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
