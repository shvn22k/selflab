import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { Text, Input, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useProfileStore } from '@/stores/profile';
import { useRouter } from 'expo-router';
import { palette, spacing, gradients, radius } from '@/theme/tokens';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp } = useAuthStore();
  const setProfile = useProfileStore((s) => s.patch);

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    const res = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (name) setProfile({ display_name: name });
  };

  const continueDemo = () => router.replace('/(auth)/onboarding');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <LinearGradient
        colors={['rgba(191,245,60,0.16)', 'rgba(54,214,200,0.05)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: insets.top + 60, paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ marginBottom: spacing['4xl'] }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.lg,
                  marginBottom: spacing.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <LinearGradient colors={gradients.lime} style={{ position: 'absolute', width: 56, height: 56 }} />
                <Text variant="display" color={palette.textInverse} style={{ fontSize: 30 }}>
                  S
                </Text>
              </View>
              <Text variant="display">SelfLab</Text>
              <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
                Your private health lab — training, nutrition, recovery and a coach that lives with you 24/7.
              </Text>
            </View>

            <View style={{ gap: spacing.md }}>
              {mode === 'signup' && (
                <Input
                  label="Name"
                  placeholder="What should I call you?"
                  value={name}
                  onChangeText={setName}
                  icon={<User size={18} color={palette.textTertiary} />}
                  autoCapitalize="words"
                />
              )}
              <Input
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                icon={<Mail size={18} color={palette.textTertiary} />}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={18} color={palette.textTertiary} />}
                secureTextEntry
                error={error}
              />
            </View>

            <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
              <Button
                label={mode === 'signin' ? 'Sign in' : 'Create my space'}
                onPress={submit}
                loading={loading}
                disabled={!email || !password}
                iconRight={<ArrowRight size={18} color={palette.textInverse} />}
              />
              <Button
                variant="ghost"
                label={mode === 'signin' ? "I don't have an account" : 'I already have an account'}
                onPress={() => {
                  setError(undefined);
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }}
                haptic={false}
              />
            </View>

            {!isSupabaseConfigured && (
              <View style={{ marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
                <Text variant="caption" color="textTertiary" align="center">
                  No backend connected yet. You can still explore the whole app in demo mode.
                </Text>
                <Button variant="secondary" label="Continue in demo mode" onPress={continueDemo} fullWidth={false} size="sm" />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
