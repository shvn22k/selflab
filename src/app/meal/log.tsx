import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Search, Sparkles, PencilLine, ScanLine, Plus, Check } from 'lucide-react-native';
import { Text, Input, Button, Card } from '@/components/ui';
import { useList, useInsert } from '@/lib/hooks';
import { estimateMealFromText, AIUnavailableError, type EstimatedFood } from '@/lib/gemini';
import { todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Food, MealType } from '@/lib/types';

type Tab = 'search' | 'ai' | 'manual' | 'scan';

function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'search', label: 'Search', icon: Search },
  { key: 'ai', label: 'AI', icon: Sparkles },
  { key: 'manual', label: 'Manual', icon: PencilLine },
  { key: 'scan', label: 'Scan', icon: ScanLine },
];

export default function LogMeal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: MealType; tab?: Tab }>();
  const [meal, setMeal] = useState<MealType>(params.meal ?? defaultMeal());
  const [tab, setTab] = useState<Tab>(params.tab ?? 'search');

  const insert = useInsert<Food>('food_logs');
  const today = todayISO();

  const addLog = (f: { name: string; servings?: number; kcal: number; protein_g: number; carb_g: number; fat_g: number }, source: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    insert.mutate({ date: today, meal, name: f.name, servings: f.servings ?? 1, kcal: f.kcal, protein_g: f.protein_g, carb_g: f.carb_g, fat_g: f.fat_g, source });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Add to {meal}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      {/* meal selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }} style={{ flexGrow: 0, marginBottom: spacing.md }}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMeal(m)}
            style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: meal === m ? palette.primary : palette.surfaceElevated, borderWidth: 1, borderColor: meal === m ? palette.primary : palette.border }}
          >
            <Text variant="label" color={meal === m ? palette.textInverse : palette.textSecondary} style={{ textTransform: 'capitalize' }}>
              {m}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* tabs */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <Pressable key={tb.key} onPress={() => setTab(tb.key)} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: active ? palette.surfaceElevated : 'transparent', borderWidth: 1, borderColor: active ? palette.borderStrong : 'transparent' }}>
              <Icon size={18} color={active ? palette.primary : palette.textTertiary} />
              <Text variant="caption" color={active ? palette.text : palette.textTertiary}>
                {tb.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'search' && <SearchTab onAdd={(f) => addLog(f, 'search')} />}
        {tab === 'ai' && <AITab onAdd={(f) => addLog(f, 'ai_text')} />}
        {tab === 'manual' && <ManualTab onAdd={(f) => addLog(f, 'manual')} onDone={() => router.back()} />}
        {tab === 'scan' && <ScanTab onAdd={(f) => addLog(f, 'barcode')} onManual={() => setTab('manual')} />}
      </View>
    </View>
  );
}

type AddFn = (f: { name: string; servings?: number; kcal: number; protein_g: number; carb_g: number; fat_g: number }) => void;

function SearchTab({ onAdd }: { onAdd: AddFn }) {
  const [q, setQ] = useState('');
  const foods = useList<Food>('foods', { limit: 300 });
  const results = useMemo(() => {
    const all = foods.data ?? [];
    if (!q.trim()) return all.slice(0, 20);
    const lower = q.toLowerCase();
    return all.filter((f) => f.name.toLowerCase().includes(lower)).slice(0, 30);
  }, [foods.data, q]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Input placeholder="Search foods…" value={q} onChangeText={setQ} icon={<Search size={18} color={palette.textTertiary} />} autoFocus />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {results.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onAdd({ name: f.name, kcal: f.kcal, protein_g: f.protein_g, carb_g: f.carb_g, fat_g: f.fat_g })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{f.name}</Text>
              <Text variant="caption" color="textTertiary">
                {f.serving_label} · {Math.round(f.kcal)} kcal · P{Math.round(f.protein_g)} C{Math.round(f.carb_g)} F{Math.round(f.fat_g)}
              </Text>
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} color={palette.primary} />
            </View>
          </Pressable>
        ))}
        {results.length === 0 ? (
          <Text variant="caption" color="textTertiary" align="center" style={{ marginTop: spacing.xl }}>
            No matches. Try the AI or Manual tab.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function AITab({ onAdd }: { onAdd: AddFn }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState<EstimatedFood[] | null>(null);
  const [error, setError] = useState<string>();

  const run = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await estimateMealFromText(text);
      setFoods(res.foods);
    } catch (e) {
      setError(e instanceof AIUnavailableError ? e.message : 'Could not estimate. Try Manual entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <Input
        placeholder="e.g. 2 scrambled eggs, 2 toast with butter, black coffee"
        value={text}
        onChangeText={setText}
        multiline
        style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.md }}
        containerStyle={{ marginBottom: spacing.md }}
      />
      <Button label="Estimate with AI" onPress={run} loading={loading} disabled={!text.trim()} icon={<Sparkles size={18} color={palette.textInverse} />} />
      {error ? (
        <Text variant="caption" color="danger" style={{ marginTop: spacing.md }}>
          {error}
        </Text>
      ) : null}
      {foods?.length ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Text variant="label" color="textSecondary">
            Estimated
          </Text>
          {foods.map((f, i) => (
            <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{f.name}</Text>
                <Text variant="caption" color="textTertiary">
                  {Math.round(f.kcal)} kcal · P{Math.round(f.protein_g)} C{Math.round(f.carb_g)} F{Math.round(f.fat_g)}
                </Text>
              </View>
              <Button size="sm" fullWidth={false} label="Add" onPress={() => onAdd(f)} icon={<Plus size={15} color={palette.textInverse} />} />
            </Card>
          ))}
          <Button
            variant="secondary"
            label="Add all"
            onPress={() => foods.forEach(onAdd)}
            icon={<Check size={18} color={palette.text} />}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function ManualTab({ onAdd, onDone }: { onAdd: AddFn; onDone: () => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');

  const submit = () => {
    onAdd({
      name: name.trim() || 'Food',
      kcal: parseFloat(kcal) || 0,
      protein_g: parseFloat(p) || 0,
      carb_g: parseFloat(c) || 0,
      fat_g: parseFloat(f) || 0,
    });
    onDone();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140, gap: spacing.md }} keyboardShouldPersistTaps="handled">
      <Input label="Name" placeholder="Food name" value={name} onChangeText={setName} autoFocus />
      <Input label="Calories (kcal)" placeholder="0" keyboardType="numeric" value={kcal} onChangeText={setKcal} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Input label="Protein" placeholder="g" keyboardType="numeric" value={p} onChangeText={setP} containerStyle={{ flex: 1 }} />
        <Input label="Carbs" placeholder="g" keyboardType="numeric" value={c} onChangeText={setC} containerStyle={{ flex: 1 }} />
        <Input label="Fat" placeholder="g" keyboardType="numeric" value={f} onChangeText={setF} containerStyle={{ flex: 1 }} />
      </View>
      <Button label="Add food" onPress={submit} disabled={!name.trim()} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

function ScanTab({ onAdd, onManual }: { onAdd: AddFn; onManual: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const foods = useList<Food>('foods', { limit: 500 });

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <ScanLine size={28} color={palette.primary} />
        <Text variant="bodyMedium" align="center">
          Allow camera access to scan barcodes.
        </Text>
        <Button label="Enable camera" fullWidth={false} onPress={requestPermission} />
      </View>
    );
  }

  const onBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const match = (foods.data ?? []).find((f) => f.barcode === data);
    if (match) {
      onAdd({ name: match.name, kcal: match.kcal, protein_g: match.protein_g, carb_g: match.carb_g, fat_g: match.fat_g });
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
      <View style={{ height: 280, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: palette.borderStrong }}>
        <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={onBarcode} />
      </View>
      <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm }}>
        {scanned ? (
          <>
            <Text variant="bodyMedium" align="center">
              Scanned {scanned}
            </Text>
            <Text variant="caption" color="textTertiary" align="center">
              No match in your foods — add it manually and it'll be saved for next time.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <Button variant="secondary" label="Scan again" fullWidth={false} onPress={() => setScanned(null)} />
              <Button label="Add manually" fullWidth={false} onPress={onManual} />
            </View>
          </>
        ) : (
          <Text variant="caption" color="textTertiary">
            Point at a barcode to scan.
          </Text>
        )}
      </View>
    </View>
  );
}
