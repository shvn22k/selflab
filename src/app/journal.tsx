import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { X, Plus, BookOpen } from 'lucide-react-native';
import { Text, Card, Input, Button, Sheet, EmptyState } from '@/components/ui';
import { useList, useInsert } from '@/lib/hooks';
import { todayISO } from '@/lib/date';
import { palette, spacing } from '@/theme/tokens';
import type { JournalEntry } from '@/lib/types';

export default function Journal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const entries = useList<JournalEntry>('journal_entries', { order: { column: 'created_at', ascending: false }, limit: 60 });
  const [adding, setAdding] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Journal</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {(entries.data ?? []).length === 0 ? (
          <EmptyState icon={<BookOpen size={24} color={palette.violet} />} title="Your journal is empty" description="Capture how training felt, wins, and reflections." />
        ) : (
          (entries.data ?? []).map((e) => (
            <Card key={e.id} style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color="textTertiary" style={{ marginBottom: 4 }}>
                {format(new Date(e.created_at), 'EEEE, d MMM · HH:mm')}
              </Text>
              {e.title ? (
                <Text variant="bodySemibold" style={{ marginBottom: 4 }}>
                  {e.title}
                </Text>
              ) : null}
              {e.body ? <Text variant="body" color="textSecondary" style={{ lineHeight: 21 }}>{e.body}</Text> : null}
            </Card>
          ))
        )}
        <Button variant="secondary" label="New entry" onPress={() => setAdding(true)} icon={<Plus size={18} color={palette.text} />} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <AddEntrySheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function AddEntrySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const insert = useInsert('journal_entries');
  const submit = () => {
    if (!body.trim() && !title.trim()) return;
    insert.mutate({ date: todayISO(), title: title.trim() || null, body: body.trim() || null });
    setTitle('');
    setBody('');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="New entry">
      <Input placeholder="Title (optional)" value={title} onChangeText={setTitle} containerStyle={{ marginBottom: spacing.md }} />
      <Input
        placeholder="What's on your mind?"
        value={body}
        onChangeText={setBody}
        multiline
        style={{ height: 130, textAlignVertical: 'top', paddingTop: spacing.md }}
        containerStyle={{ marginBottom: spacing.lg }}
      />
      <Button label="Save entry" onPress={submit} disabled={!body.trim() && !title.trim()} />
    </Sheet>
  );
}
