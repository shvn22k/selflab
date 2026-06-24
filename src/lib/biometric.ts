import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticate(reason = 'Unlock SelfLab'): Promise<boolean> {
  const available = await isBiometricAvailable();
  if (!available) return true; // nothing to authenticate against → allow
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  });
  return result.success;
}
