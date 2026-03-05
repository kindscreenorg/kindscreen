import { vi } from 'vitest'

/**
 * Create a chainable Supabase query builder mock.
 * All chainable methods return `this`. The builder itself is thenable (awaitable)
 * so that `await supabase.from('t').insert(...)` works without calling single/maybeSingle.
 */
export function createMockBuilder(defaults: {
  data?: unknown
  error?: unknown
  count?: number | null
} = {}) {
  const terminal = {
    data: defaults.data ?? null,
    error: defaults.error ?? null,
    count: defaults.count ?? null,
  }
  const builder: Record<string, unknown> = {}

  // All chainable methods return the builder itself
  for (const method of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'not', 'gt', 'gte', 'lt', 'lte',
    'order', 'limit', 'range', 'filter',
  ]) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  // Terminal methods that return promises
  builder.single = vi.fn().mockResolvedValue(terminal)
  builder.maybeSingle = vi.fn().mockResolvedValue(terminal)

  // Make the builder itself thenable (awaitable) for patterns like:
  //   await supabase.from('t').insert(...)
  //   const { count } = await supabase.from('t').select('id', { count: 'exact', head: true })...
  builder.then = vi.fn().mockImplementation(
    (resolve: (v: typeof terminal) => void, _reject: unknown) =>
      Promise.resolve(terminal).then(resolve)
  )

  return builder
}

/** Full mock Supabase client. Pass overrides per-test. */
export function createMockSupabaseClient(overrides: {
  auth?: Partial<{
    getUser: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
    exchangeCodeForSession: ReturnType<typeof vi.fn>
  }>
  from?: ReturnType<typeof vi.fn>
  rpc?: ReturnType<typeof vi.fn>
} = {}) {
  return {
    from: overrides.from ?? vi.fn().mockReturnValue(createMockBuilder()),
    rpc: overrides.rpc ?? vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
      ...overrides.auth,
    },
  }
}
