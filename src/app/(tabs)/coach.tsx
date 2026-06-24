import { useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Sparkles, Send, Volume2, Sun, Moon, Bed, CircleDot, HeartPulse, BookOpen, LineChart as LineChartIcon, CalendarDays, Settings as SettingsIcon } from 'lucide-react-native';
import { Text, Card } from '@/components/ui';
import { useToday } from '@/features/today';
import { useList, useInsert, useUpsert } from '@/lib/hooks';
import { coachChat, generateBriefing } from '@/lib/gemini';
import { buildCoachContext, localCoachReply } from '@/lib/coachContext';
import { todayISO, greeting } from '@/lib/date';
import { palette, spacing, radius, gradients } from '@/theme/tokens';
import type { AiMessage, Briefing } from '@/lib/types';

const PROMPTS = ['What should I eat tonight?', 'Plan my workout today', 'Am I on track this week?', 'Why is my recovery low?'];

const TOOLS = [
  { label: 'Sleep', icon: Bed, route: '/sleep', color: palette.sleep },
  { label: 'Habits', icon: CircleDot, route: '/habits', color: palette.primary },
  { label: 'Wellbeing', icon: HeartPulse, route: '/wellbeing', color: palette.emerald },
  { label: 'Plan', icon: CalendarDays, route: '/schedule', color: palette.cyan },
  { label: 'Progress', icon: LineChartIcon, route: '/progress', color: palette.amber },
  { label: 'Journal', icon: BookOpen, route: '/journal', color: palette.violet },
] as const;

export default function Coach() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useToday();
  const ctx = useMemo(() => buildCoachContext(t), [t]);
  const today = todayISO();

  const messages = useList<AiMessage>('ai_messages', { order: { column: 'created_at', ascending: true }, limit: 100 });
  const insertMsg = useInsert('ai_messages');
  const briefings = useList<Briefing>('briefings', { eq: { date: today } });
  const upsertBriefing = useUpsert('briefings', ['user_id', 'date', 'kind']);

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [briefingBusy, setBriefingBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const coachName = t.profile?.coach_name ?? 'Atlas';
  const briefKind = new Date().getHours() < 15 ? 'morning' : 'evening';
  const briefing = (briefings.data ?? []).find((b) => b.kind === briefKind);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await insertMsg.mutateAsync({ role: 'user', content });
    setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    const history = [...(messages.data ?? []).map((m) => ({ role: m.role, content: m.content })), { role: 'user' as const, content }];
    try {
      const { reply } = await coachChat(history, ctx);
      await insertMsg.mutateAsync({ role: 'assistant', content: reply });
    } catch {
      await insertMsg.mutateAsync({ role: 'assistant', content: localCoachReply(ctx) });
    } finally {
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const makeBriefing = async () => {
    setBriefingBusy(true);
    try {
      const { content } = await generateBriefing(briefKind, ctx);
      upsertBriefing.mutate({ date: today, kind: briefKind, content });
    } catch {
      upsertBriefing.mutate({ date: today, kind: briefKind, content: localCoachReply(ctx) });
    } finally {
      setBriefingBusy(false);
    }
  };

  const msgs = messages.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
            <LinearGradient colors={gradients.lime} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color={palette.textInverse} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text variant="h2">{coachName}</Text>
              <Text variant="caption" color="textTertiary">
                {greeting()}, {t.profile?.display_name ?? 'there'}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}>
              <SettingsIcon size={18} color={palette.textSecondary} />
            </Pressable>
          </View>

          {/* briefing */}
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card sheen glow={palette.primary} style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
                {briefKind === 'morning' ? <Sun size={16} color={palette.primary} /> : <Moon size={16} color={palette.primary} />}
                <Text variant="label" color={palette.primary}>
                  {briefKind === 'morning' ? "Morning briefing" : 'Evening recap'}
                </Text>
              </View>
              {briefing?.content ? (
                <>
                  <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                    {briefing.content}
                  </Text>
                  <Pressable onPress={() => Speech.speak(briefing.content ?? '')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md }}>
                    <Volume2 size={15} color={palette.textSecondary} />
                    <Text variant="caption" color="textSecondary">
                      Read aloud
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={makeBriefing} disabled={briefingBusy}>
                  <Text variant="bodyMedium" color="textSecondary">
                    {briefingBusy ? 'Thinking…' : `Tap to generate your ${briefKind} briefing from today's data.`}
                  </Text>
                </Pressable>
              )}
            </Card>
          </Animated.View>

          {/* tools */}
          <Text variant="label" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm }}>
            Your tools
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl }}>
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Pressable key={tool.label} onPress={() => router.push(tool.route as never)} style={{ width: '47%' }}>
                  <Card padded style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
                    <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: `${tool.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={tool.color} />
                    </View>
                    <Text variant="bodyMedium">{tool.label}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {/* conversation */}
          {msgs.length === 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="label" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Ask me anything
              </Text>
              {PROMPTS.map((p) => (
                <Pressable key={p} onPress={() => send(p)} style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border }}>
                  <Text variant="bodyMedium" color="textSecondary">
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            msgs.map((m) => <Bubble key={m.id} role={m.role} content={m.content} />)
          )}
          {thinking ? (
            <Animated.View entering={FadeIn} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
              <ActivityIndicator color={palette.primary} size="small" />
              <Text variant="caption" color="textTertiary">
                {coachName} is thinking…
              </Text>
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* composer */}
        <View style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: insets.bottom + 92, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceElevated, borderRadius: radius.pill, paddingLeft: spacing.lg, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: palette.borderStrong }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${coachName}…`}
            placeholderTextColor={palette.textTertiary}
            style={{ flex: 1, color: palette.text, fontFamily: 'Inter_400Regular', fontSize: 15, maxHeight: 100 }}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <Pressable onPress={() => send(input)} disabled={!input.trim() || thinking} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: input.trim() ? palette.primary : palette.surfaceHigh }}>
            <Send size={18} color={input.trim() ? palette.textInverse : palette.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%', marginBottom: spacing.md }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.xl,
          backgroundColor: isUser ? palette.primary : palette.surface,
          borderWidth: isUser ? 0 : 1,
          borderColor: palette.border,
          borderBottomRightRadius: isUser ? 6 : radius.xl,
          borderBottomLeftRadius: isUser ? radius.xl : 6,
        }}
      >
        <Text variant="bodyMedium" color={isUser ? palette.textInverse : palette.text} style={{ lineHeight: 21 }}>
          {content}
        </Text>
      </View>
    </Animated.View>
  );
}
