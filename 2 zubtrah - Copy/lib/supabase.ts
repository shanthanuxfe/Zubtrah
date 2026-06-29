const STORAGE_KEY = 'zubtrah_subscriptions_v1';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const fallbackStorage = new Map<string, string>();

function getStorage(): StorageLike {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage as StorageLike;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage as StorageLike;
  }
  return {
    getItem: (key: string) => fallbackStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      fallbackStorage.set(key, value);
    },
    removeItem: (key: string) => {
      fallbackStorage.delete(key);
    },
  };
}

export type BillingCycle = 'monthly' | 'yearly';

export type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  renewal_date: string;
  category: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type LocalQueryOperation = 'select' | 'insert' | 'update' | 'delete';

type LocalQueryFilter = {
  column: string;
  value: unknown;
};

type LocalQueryOrder = {
  column: string;
  ascending: boolean;
};

type QueryResult<T = unknown> = {
  data: T;
  error: { message: string } | null;
};

class LocalQueryBuilder implements PromiseLike<QueryResult<any>> {
  constructor(
    private readonly table: string,
    private readonly operation: LocalQueryOperation = 'select',
    private readonly payload?: Partial<Subscription>
  ) {}

  private filters: LocalQueryFilter[] = [];
  private orderBy?: LocalQueryOrder;
  private maybeSingleValue = false;

  select(_columns: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  maybeSingle() {
    this.maybeSingleValue = true;
    return this;
  }

  insert(payload: Partial<Subscription>) {
    return new LocalQueryBuilder(this.table, 'insert', payload);
  }

  update(payload: Partial<Subscription>) {
    return new LocalQueryBuilder(this.table, 'update', payload);
  }

  delete() {
    return new LocalQueryBuilder(this.table, 'delete');
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async thenable(): Promise<QueryResult<any>> {
    return this.execute();
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally);
  }

  private async execute(): Promise<QueryResult<any>> {
    if (this.table !== 'subscriptions') {
      return { data: null, error: null };
    }

    const items = await readSubscriptions();
    const matches = (item: Subscription) => this.filters.every(({ column, value }) => item[column as keyof Subscription] === value);

    switch (this.operation) {
      case 'select': {
        let result = items.filter(matches);
        if (this.orderBy) {
          const column = this.orderBy.column as keyof Subscription;
          const ascending = this.orderBy.ascending;
          result = [...result].sort((a, b) => {
            const leftValue = (a[column] ?? '').toString();
            const rightValue = (b[column] ?? '').toString();
            const comparison = leftValue.localeCompare(rightValue);
            return ascending ? comparison : -comparison;
          });
        }
        return { data: this.maybeSingleValue ? (result[0] ?? null) : result, error: null };
      }
      case 'insert': {
        const nextItem = {
          ...(this.payload as Subscription),
          id: createId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Subscription;
        const nextItems = [...items, nextItem];
        await writeSubscriptions(nextItems);
        return { data: nextItem, error: null };
      }
      case 'update': {
        const updatedItems = items.map((item) => {
          if (!matches(item)) return item;
          return { ...item, ...(this.payload as Partial<Subscription>), updated_at: new Date().toISOString() } as Subscription;
        });
        await writeSubscriptions(updatedItems);
        return { data: updatedItems.filter(matches), error: null };
      }
      case 'delete': {
        const remainingItems = items.filter((item) => !matches(item));
        await writeSubscriptions(remainingItems);
        return { data: null, error: null };
      }
      default:
        return { data: null, error: null };
    }
  }
}

class LocalStorageClient {
  from(table: string) {
    return new LocalQueryBuilder(table);
  }
}

function createId(): string {
  if (typeof globalThis !== 'undefined' && 'crypto' in globalThis && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readSubscriptions(): Promise<Subscription[]> {
  const storage = getStorage();
  const raw = storage?.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Subscription[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubscriptions(subscriptions: Subscription[]): Promise<void> {
  const payload = JSON.stringify(subscriptions);
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, payload);
}

export const supabase = new LocalStorageClient();

export async function getSubscriptions(): Promise<Subscription[]> {
  return readSubscriptions();
}

export async function createSubscription(input: Partial<Subscription>): Promise<Subscription> {
  const items = await readSubscriptions();
  const nextItem = {
    ...(input as Subscription),
    id: createId(),
    created_at: input.created_at ?? new Date().toISOString(),
    updated_at: input.updated_at ?? new Date().toISOString(),
  } as Subscription;
  await writeSubscriptions([...items, nextItem]);
  return nextItem;
}

export async function updateSubscription(id: string, patch: Partial<Subscription>): Promise<Subscription | null> {
  const items = await readSubscriptions();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated = {
    ...items[index],
    ...patch,
    id,
    updated_at: new Date().toISOString(),
  } as Subscription;
  items[index] = updated;
  await writeSubscriptions(items);
  return updated;
}

export async function deleteSubscription(id: string): Promise<boolean> {
  const items = await readSubscriptions();
  const nextItems = items.filter((item) => item.id !== id);
  await writeSubscriptions(nextItems);
  return true;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function formatRenewalLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} Days overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day left';
  if (days < 30) return `${days} Days left`;
  const months = Math.round(days / 30);
  if (months === 1) return '1 Month left';
  return `${months} Months left`;
}

export function daysLeftColor(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days <= 0) return '#CC3333';   // red — overdue or today
  if (days <= 7) return '#D97706';   // orange — this week
  return '#1A6B5A';                  // green — 8+ days
}

export function monthlyEquivalent(price: number, cycle: BillingCycle): number {
  if (cycle === 'monthly') return price;
  return price / 12;
}
