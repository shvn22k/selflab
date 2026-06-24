import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeOut, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowRight, ArrowLeft, Check, Flame, Dumbbell, Target, Activity as ActIcon } from 'lucide-react-native';
import { Text, Button, Input, Card } from '@/components/ui';
import { Ring } from '@/components/ui/Ring';
import { palette, spacing, radius } from '@/theme/tokens';
import { ACTIVITY_LABELS, GOAL_LABELS, calcTargets, waterTargetMl } from '@/lib/nutrition';
import { saveProfile } from '@/lib/profile';
import { useProfileStore } from '@/stores/profile';
import type { ActivityLevel, Goal, Sex } from '@/lib/types';

type Draft = {
  display_name?: string;
  sex?: Sex;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  activity_level?: ActivityLevel;
  goal?: Goal;
};

const STEPS = ['name', 'sex', 'body', 'activity', 'goal', 'target', 'review'] as const;
type Step = (typeof STEPS)[number];

function OptionCard({ label, sub, active, icon, onPress }: { label: string; sub?: string; active: boolean; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: active ? palette.primarySoft : palette.surface,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.border,
      }}
    >
      {icon ? <View style={{ width: 28, alignItems: 'center' }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodySemibold" color={active ? palette.primary : palette.text}>
          {label}
        </Text>
        {sub ? (
          <Text variant="caption" color="textTertiary">
            {sub}
          </Text>
        ) : null}
      </View>
      {active ? <Check size={18} color={palette.primary} /> : null}
    </Pressable>
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const existingName = useProfileStore((s) => s.profile?.display_name);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);

  const [stepIdx, setStepIdx] = useState(existingName ? 1 : 0);
  const [d, setD] = useState<Draft>({
    display_name: existingName ?? undefined,
    sex: 'male',
    activity_level: 'moderate',
    goal: 'lose_fat',
  });
  const [saving, setSaving] = useState(false);

  const step: Step = STEPS[stepIdx];
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const targets = useMemo(() => {
    if (!d.sex || !d.weight_kg || !d.height_cm || !d.age || !d.activity_level || !d.goal) return null;
    return calcTargets({
      sex: d.sex,
      weightKg: d.weight_kg,
      heightCm: d.height_cm,
      age: d.age,
      activity: d.activity_level,
      goal: d.goal,
    });
  }, [d]);

  const canAdvance = (): boolean => {
    switch (step) {
      case 'name':
        return !!d.display_name?.trim();
      case 'sex':
        return !!d.sex;
      case 'body':
        return !!d.age && !!d.height_cm && !!d.weight_kg;
      case 'activity':
        return !!d.activity_level;
      case 'goal':
        return !!d.goal;
      case 'target':
        return true;
      default:
        return true;
    }
  };

  const next = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
      return;
    }
    // finish
    setSaving(true);
    const computed = targets;
    await saveProfile({
      display_name: d.display_name,
      sex: d.sex,
      height_cm: d.height_cm,
      weight_kg: d.weight_kg,
      target_weight_kg: d.target_weight_kg,
      activity_level: d.activity_level,
      goal: d.goal,
      bmr: computed?.bmr ?? null,
      tdee: computed?.tdee ?? null,
      calorie_target: computed?.calorieTarget ?? null,
      protein_target_g: computed?.proteinG ?? null,
      carb_target_g: computed?.carbG ?? null,
      fat_target_g: computed?.fatG ?? null,
      water_target_ml: d.weight_kg ? waterTargetMl(d.weight_kg) : 3000,
      onboarded: true,
    });
    completeOnboarding({ onboarded: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const back = () => {
    if (stepIdx === 0) return;
    setStepIdx((i) => i - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.md }}>
      {/* progress */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= stepIdx ? palette.primary : palette.surfaceHigh,
            }}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={step} entering={FadeInRight.duration(280)} exiting={FadeOut.duration(120)}>
          {step === 'name' && (
            <StepShell title="Let's make this yours" subtitle="First, what should your coach call you?">
              <Input
                placeholder="Your name"
                value={d.display_name}
                onChangeText={(t) => set({ display_name: t })}
                autoFocus
                autoCapitalize="words"
              />
            </StepShell>
          )}

          {step === 'sex' && (
            <StepShell title="Biological sex" subtitle="Used for accurate metabolic calculations.">
              <View style={{ gap: spacing.sm }}>
                {(['male', 'female', 'other'] as Sex[]).map((s) => (
                  <OptionCard key={s} label={s[0].toUpperCase() + s.slice(1)} active={d.sex === s} onPress={() => set({ sex: s })} />
                ))}
              </View>
            </StepShell>
          )}

          {step === 'body' && (
            <StepShell title="Your numbers" subtitle="These set your calorie and macro targets.">
              <View style={{ gap: spacing.md }}>
                <Input
                  label="Age"
                  placeholder="years"
                  keyboardType="number-pad"
                  value={d.age ? String(d.age) : ''}
                  onChangeText={(t) => set({ age: parseInt(t) || undefined })}
                />
                <Input
                  label="Height (cm)"
                  placeholder="cm"
                  keyboardType="numeric"
                  value={d.height_cm ? String(d.height_cm) : ''}
                  onChangeText={(t) => set({ height_cm: parseFloat(t) || undefined })}
                />
                <Input
                  label="Weight (kg)"
                  placeholder="kg"
                  keyboardType="numeric"
                  value={d.weight_kg ? String(d.weight_kg) : ''}
                  onChangeText={(t) => set({ weight_kg: parseFloat(t) || undefined })}
                />
              </View>
            </StepShell>
          )}

          {step === 'activity' && (
            <StepShell title="How active are you?" subtitle="Outside of dedicated workouts.">
              <View style={{ gap: spacing.sm }}>
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                  <OptionCard
                    key={a}
                    label={a.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    sub={ACTIVITY_LABELS[a]}
                    icon={<ActIcon size={18} color={d.activity_level === a ? palette.primary : palette.textTertiary} />}
                    active={d.activity_level === a}
                    onPress={() => set({ activity_level: a })}
                  />
                ))}
              </View>
            </StepShell>
          )}

          {step === 'goal' && (
            <StepShell title="Your main goal" subtitle="We can fine-tune this anytime.">
              <View style={{ gap: spacing.sm }}>
                {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                  <OptionCard
                    key={g}
                    label={GOAL_LABELS[g]}
                    icon={
                      g === 'build_muscle' ? (
                        <Dumbbell size={18} color={d.goal === g ? palette.primary : palette.textTertiary} />
                      ) : g === 'lose_fat' ? (
                        <Flame size={18} color={d.goal === g ? palette.primary : palette.textTertiary} />
                      ) : (
                        <Target size={18} color={d.goal === g ? palette.primary : palette.textTertiary} />
                      )
                    }
                    active={d.goal === g}
                    onPress={() => set({ goal: g })}
                  />
                ))}
              </View>
            </StepShell>
          )}

          {step === 'target' && (
            <StepShell title="Goal weight" subtitle="Optional — helps track your trend. Skip if unsure.">
              <Input
                label="Target weight (kg)"
                placeholder="kg"
                keyboardType="numeric"
                value={d.target_weight_kg ? String(d.target_weight_kg) : ''}
                onChangeText={(t) => set({ target_weight_kg: parseFloat(t) || undefined })}
              />
            </StepShell>
          )}

          {step === 'review' && targets && (
            <StepShell title="Your plan is ready" subtitle={`Tuned for ${GOAL_LABELS[d.goal!].toLowerCase()}.`}>
              <Card sheen style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                <Ring progress={1} size={150} stroke={14} color={palette.calories} colorTo={palette.teal}>
                  <Text variant="caption" color="textTertiary">
                    DAILY TARGET
                  </Text>
                  <Text variant="hero" style={{ fontSize: 38 }}>
                    {targets.calorieTarget}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    kcal
                  </Text>
                </Ring>
                <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xl }}>
                  <MacroPill label="Protein" value={targets.proteinG} color={palette.protein} />
                  <MacroPill label="Carbs" value={targets.carbG} color={palette.carbs} />
                  <MacroPill label="Fat" value={targets.fatG} color={palette.fat} />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl }}>
                  <Text variant="caption" color="textTertiary">
                    BMR {targets.bmr}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    •  TDEE {targets.tdee}
                  </Text>
                </View>
              </Card>
              <Text variant="caption" color="textTertiary" align="center" style={{ marginTop: spacing.lg }}>
                You can adjust every number later in Settings.
              </Text>
            </StepShell>
          )}
        </Animated.View>
      </ScrollView>

      {/* footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.md,
          flexDirection: 'row',
          gap: spacing.md,
          backgroundColor: palette.bg,
        }}
      >
        {stepIdx > 0 && (
          <Button
            variant="secondary"
            onPress={back}
            fullWidth={false}
            icon={<ArrowLeft size={18} color={palette.text} />}
            style={{ width: 56 }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Button
            label={step === 'review' ? 'Start' : 'Continue'}
            onPress={next}
            disabled={!canAdvance()}
            loading={saving}
            iconRight={step === 'review' ? <Check size={18} color={palette.textInverse} /> : <ArrowRight size={18} color={palette.textInverse} />}
          />
        </View>
      </View>
    </View>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="h1">{title}</Text>
        {subtitle ? (
          <Text variant="body" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="h3" color={color} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
        {value}
        <Text variant="caption" color="textTertiary">
          g
        </Text>
      </Text>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
    </View>
  );
}
