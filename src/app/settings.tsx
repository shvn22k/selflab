import { useState } from 'react';
import { View, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Bell, Fingerprint, Vibrate, Watch, Flame, Sparkles, LogOut, RefreshCw, ChevronRight } from 'lucide-react-native';
import { Text, Card, Input, Button, Sheet, Divider } from '@/components/ui';
import { useSettings } from '@/stores/settings';
import { useProfileStore } from '@/stores/profile';
import { useAuthStore } from '@/stores/auth';
import { saveProfile } from '@/lib/profile';
import { requestNotificationPermissions, scheduleCoreReminders, cancelAllReminders } from '@/lib/notifications';
import { isBiometricAvailable } from '@/lib/biometric';
import { GOAL_LABELS } from '@/lib/nutrition';
import { isSupabaseConfigured } from '@/lib/supabase';
import { palette, spacing, radius } from '@/theme/tokens';
import type { CoachProactivity, Goal } from '@/lib/types';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const resetOnboarding = useProfileStore((s) => s.reset);
  const signOut = useAuthStore((s) => s.signOut);
  const s = useSettings();
  const [editTargets, setEditTargets] = useState(false);
  const [coachName, setCoachName] = useState(profile?.coach_name ?? 'Atlas');

  const toggleNotifications = async (v: boolean) => {
    s.setNotificationsEnabled(v);
    if (v) {
      const ok = await requestNotificationPermissions();
      if (ok) await scheduleCoreReminders();
      else s.setNotificationsEnabled(false);
    } else {
      await cancelAllReminders();
    }
  };

  const toggleBiometric = async (v: boolean) => {
    if (v) {
      const ok = await isBiometricAvailable();
      if (!ok) {
        Alert.alert('Not available', 'No biometrics are enrolled on this device.');
        return;
      }
    }
    s.setBiometricLock(v);
  };

  const proactivity: CoachProactivity[] = ['high', 'balanced', 'minimal'];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Settings</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {/* Profile */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
            Profile
          </Text>
          <Text variant="h3">{profile?.display_name ?? 'You'}</Text>
          <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {profile?.goal ? GOAL_LABELS[profile.goal as Goal] : 'Lose fat'} · {profile?.weight_kg ?? '–'} kg
          </Text>
          <Pressable onPress={() => setEditTargets(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Flame size={16} color={palette.calories} />
              <Text variant="bodyMedium">Daily targets</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="caption" color="textTertiary">
                {profile?.calorie_target ?? 2200} kcal
              </Text>
              <ChevronRight size={16} color={palette.textTertiary} />
            </View>
          </Pressable>
        </Card>

        {/* Coach */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Sparkles size={16} color={palette.primary} />
            <Text variant="bodySemibold">Coach</Text>
          </View>
          <Input label="Coach name" value={coachName} onChangeText={setCoachName} onBlur={() => saveProfile({ coach_name: coachName.trim() || 'Atlas' })} containerStyle={{ marginBottom: spacing.md }} />
          <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
            How proactive should {coachName} be?
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {proactivity.map((p) => {
              const active = (profile?.coach_proactivity ?? 'high') === p;
              return (
                <Pressable key={p} onPress={() => saveProfile({ coach_proactivity: p })} style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: active ? palette.primary : palette.surfaceElevated, borderWidth: 1, borderColor: active ? palette.primary : palette.border }}>
                  <Text variant="label" color={active ? palette.textInverse : palette.textSecondary} style={{ textTransform: 'capitalize' }}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Preferences */}
        <Card style={{ marginBottom: spacing.lg }}>
          <ToggleRow icon={<Bell size={18} color={palette.amber} />} label="Daily reminders" value={s.notificationsEnabled} onChange={toggleNotifications} />
          <Divider />
          <ToggleRow icon={<Fingerprint size={18} color={palette.cyan} />} label="Biometric app lock" value={s.biometricLock} onChange={toggleBiometric} />
          <Divider />
          <ToggleRow icon={<Vibrate size={18} color={palette.violet} />} label="Haptics" value={s.hapticsEnabled} onChange={s.setHaptics} />
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
            <Watch size={18} color={s.healthConnectEnabled ? palette.steps : palette.textTertiary} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              Health Connect
            </Text>
            <Text variant="caption" color={s.healthConnectEnabled ? palette.steps : 'textTertiary'}>
              {s.healthConnectEnabled ? 'Connected' : 'Connect in Activity'}
            </Text>
          </View>
        </Card>

        {/* Account */}
        <Card style={{ marginBottom: spacing.lg }}>
          {isSupabaseConfigured ? (
            <>
              <Pressable onPress={() => signOut()} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
                <LogOut size={18} color={palette.danger} />
                <Text variant="bodyMedium" color={palette.danger}>
                  Sign out
                </Text>
              </Pressable>
              <Divider />
            </>
          ) : null}
          <Pressable
            onPress={() =>
              Alert.alert('Reset onboarding?', 'This clears your local profile and restarts setup.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => { resetOnboarding(); router.replace('/(auth)/onboarding'); } },
              ])
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}
          >
            <RefreshCw size={18} color={palette.textSecondary} />
            <Text variant="bodyMedium" color="textSecondary">
              Reset onboarding
            </Text>
          </Pressable>
        </Card>

        <Text variant="caption" color="textTertiary" align="center">
          SelfLab · v1.0.0 · built for you
        </Text>
      </ScrollView>

      <EditTargetsSheet visible={editTargets} onClose={() => setEditTargets(false)} />
    </View>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
      {icon}
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.primary, false: palette.surfaceHigh }} thumbColor={palette.white} />
    </View>
  );
}

function EditTargetsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const [cal, setCal] = useState(String(profile?.calorie_target ?? 2200));
  const [p, setP] = useState(String(profile?.protein_target_g ?? 150));
  const [c, setC] = useState(String(profile?.carb_target_g ?? 200));
  const [f, setF] = useState(String(profile?.fat_target_g ?? 70));

  const submit = () => {
    saveProfile({
      calorie_target: parseFloat(cal) || null,
      protein_target_g: parseFloat(p) || null,
      carb_target_g: parseFloat(c) || null,
      fat_target_g: parseFloat(f) || null,
    });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Daily targets">
      <Input label="Calories (kcal)" value={cal} onChangeText={setCal} keyboardType="numeric" containerStyle={{ marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <Input label="Protein" value={p} onChangeText={setP} keyboardType="numeric" containerStyle={{ flex: 1 }} />
        <Input label="Carbs" value={c} onChangeText={setC} keyboardType="numeric" containerStyle={{ flex: 1 }} />
        <Input label="Fat" value={f} onChangeText={setF} keyboardType="numeric" containerStyle={{ flex: 1 }} />
      </View>
      <Button label="Save targets" onPress={submit} />
    </Sheet>
  );
}
