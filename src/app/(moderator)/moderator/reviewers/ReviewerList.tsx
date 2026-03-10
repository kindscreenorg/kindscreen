'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/client';

export interface ReviewerRow {
  id: string;
  username: string;
  review_count: number;
  is_trusted: boolean;
  is_moderator: boolean;
  is_admin: boolean;
}

export default function ReviewerList({
  initialReviewers,
  currentIsAdmin
}: {
  initialReviewers: ReviewerRow[];
  currentIsAdmin: boolean;
}) {
  const [reviewers, setReviewers] = useState(initialReviewers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useT();
  async function toggle(
    id: string,
    field: 'is_trusted' | 'is_moderator',
    value: boolean
  ) {
    setErrors((e) => ({ ...e, [id]: '' }));

    const res = await fetch(`/api/moderator/reviewers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value })
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setErrors((e) => ({
        ...e,
        [id]: json.error ?? 'Something went wrong.'
      }));
      return;
    }

    const updated = (await res.json()) as ReviewerRow;
    setReviewers((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
  }

  return (
    <div className="space-y-3">
      {reviewers.map((r) => (
        <div key={r.id} className="card-warm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-heading font-semibold text-warm-800">
                {r.username}
                {r.is_admin && (
                  <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {t.reviewPage.admin}
                  </span>
                )}
              </p>
              <p className="text-xs text-warm-400 mt-0.5">
                {r.review_count}{' '}
                {r.review_count === 1
                  ? t.reviewPage.reviews_one
                  : t.reviewPage.reviews_other}
              </p>
              {errors[r.id] && (
                <p className="text-xs text-rose-500 mt-1">{errors[r.id]}</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Trusted toggle — any moderator */}
              <Toggle
                label={t.reviewPage.trusted}
                active={r.is_trusted}
                disabled={r.is_admin}
                onToggle={() => toggle(r.id, 'is_trusted', !r.is_trusted)}
              />

              {/* Moderator toggle — admins only */}
              {currentIsAdmin && (
                <Toggle
                  label={t.reviewPage.moderator}
                  active={r.is_moderator}
                  disabled={r.is_admin}
                  onToggle={() => toggle(r.id, 'is_moderator', !r.is_moderator)}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Toggle({
  label,
  active,
  disabled,
  onToggle
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-sage-100 border-sage-300 text-sage-700'
          : 'bg-white border-warm-200 text-warm-500 hover:border-warm-300'
      }`}
    >
      <span
        className={`w-3 h-3 rounded-full border-2 ${
          active ? 'bg-sage-500 border-sage-500' : 'bg-white border-warm-300'
        }`}
      />
      {label}
    </button>
  );
}
