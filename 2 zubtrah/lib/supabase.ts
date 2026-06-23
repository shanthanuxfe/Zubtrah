import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
