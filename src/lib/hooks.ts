import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRows, insertRow, updateRow, deleteRow, upsertRow, type ListOptions } from './data';

/** Stable query key for a table + options. */
export function tableKey(table: string, opts?: ListOptions | Record<string, unknown>) {
  return ['table', table, opts ?? {}] as const;
}

export function useList<T>(table: string, opts: ListOptions = {}, enabled = true) {
  return useQuery({
    queryKey: tableKey(table, opts),
    queryFn: () => listRows<T>(table, opts),
    enabled,
  });
}

/** Invalidate every cached query for a table after a write. */
function useInvalidate(table: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['table', table] });
}

export function useInsert<T>(table: string) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: (values: Record<string, any>) => insertRow<T>(table, values),
    onSuccess: invalidate,
  });
}

export function useUpsert<T>(table: string, onConflict: string[]) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: (values: Record<string, any>) => upsertRow<T>(table, values, onConflict),
    onSuccess: invalidate,
  });
}

export function useUpdate(table: string) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, any> }) => updateRow(table, id, values),
    onSuccess: invalidate,
  });
}

export function useDelete(table: string) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: invalidate,
  });
}
