/**
 * Contribution point system — The Fibonacci Scale
 *
 * Points are awarded based on the number of edits a contributor has made.
 * The curve follows a Fibonacci-style growth rule: each tier's value is the
 * sum of the previous two tiers' values, scaled by a fixed base.
 *
 *   Points = BASE · Fₙ
 *
 * where Fₙ is the Fibonacci sequence seeded with F₁ = 1, F₂ = 2
 * (1, 2, 3, 5, 8, 13, …). With BASE = 100 this yields:
 *
 *   1 edit  → 100   (100 · 1)
 *   2 edits → 200   (100 · 2)
 *   3 edits → 300   (100 · 3)
 *   4 edits → 500   (100 · 5)
 *   5 edits → 800   (100 · 8)
 *
 * Best for: a natural, organic growth curve commonly used in agile estimation.
 */

import { prisma } from '../lib/prisma.js';

/** Fixed multiplier applied to the Fibonacci tier value. */
export const POINTS_BASE = 100;

/**
 * Compute contribution points for a given number of edits using the
 * Fibonacci Scale. Returns 0 for zero or negative edits.
 *
 * @param edits - Total number of completed edits.
 */
export function fibonacciPoints(edits: number): number {
  const n = Math.floor(edits);
  if (n <= 0) return 0;

  // Fibonacci sequence seeded with F₁ = 1, F₂ = 2 (so F = 1, 2, 3, 5, 8, …).
  let prev = 1; // F₁
  let curr = 2; // F₂
  if (n === 1) return POINTS_BASE * prev;
  for (let i = 3; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return POINTS_BASE * curr;
}

/**
 * Total number of completed edits a user has made: every approved draft
 * (new page or page edit) submitted by the user.
 */
export async function countUserEdits(userId: number): Promise<number> {
  return prisma.pending_pages.count({
    where: {
      editor_id: userId,
      status: 'approved',
    },
  });
}

/**
 * Recompute and persist a user's contribution points from their edit count,
 * keeping the stored `users.points` column in sync with the Fibonacci Scale.
 * Returns the newly computed point total.
 */
export async function recomputeUserPoints(userId: number): Promise<number> {
  const edits = await countUserEdits(userId);
  const points = fibonacciPoints(edits);
  await prisma.users.update({
    where: { user_id: userId },
    data: { points },
  });
  return points;
}
