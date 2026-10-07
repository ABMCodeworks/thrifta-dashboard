import test from 'node:test';
import assert from 'node:assert/strict';
import { planUndraft, subscriptionProductLimit } from '../src/utils/productPublishingPolicy.js';

const subscriber = { isPremium: true, salesUploadLimit: 5 };
const draft = id => ({ id, draft: true, sold: false });

test('only active subscribers can undraft, regardless of a stale plan label', () => {
  for (const user of [null, {}, { isPremium: false, subscriptionEntitlementId: 'premium' }]) {
    assert.equal(subscriptionProductLimit(user), 0);
    assert.equal(planUndraft(user, [draft('a')]).selected.length, 0);
  }
});

test('uses the stored subscription allowance and a safe fallback for invalid limits', () => {
  assert.equal(subscriptionProductLimit(subscriber), 5);
  for (const limit of [undefined, 0, -1, '100', Infinity, 1.5]) {
    assert.equal(subscriptionProductLimit({ isPremium: true, salesUploadLimit: limit }), 3);
  }
});

test('publishes only remaining slots and includes hidden listings in the count', () => {
  const products = [
    { id: 'live', draft: false, sold: false },
    { id: 'hidden', draft: false, sold: false, hidden: true },
    { id: 'sold', draft: false, sold: true },
    ...['e', 'd', 'c', 'b', 'a'].map(draft),
  ];
  const plan = planUndraft(subscriber, products);
  assert.equal(plan.active, 2);
  assert.deepEqual(plan.selected.map(p => p.id), ['a', 'b', 'c']);
  assert.equal(plan.skipped, 2);
});

test('at or above the limit, unsold drafts remain drafts', () => {
  for (const count of [5, 6]) {
    const live = Array.from({ length: count }, (_, i) => ({ id: `live-${i}`, sold: false, draft: false }));
    assert.equal(planUndraft(subscriber, [...live, draft('a')]).selected.length, 0);
  }
});

test('sold drafts do not consume slots and no status fields are mutated', () => {
  const soldDraft = Object.freeze({ id: 'sold-draft', draft: true, sold: true, hidden: true });
  const plan = planUndraft({ isPremium: true, salesUploadLimit: 1 }, [draft('a'), soldDraft]);
  assert.equal(plan.selected.length, 2);
  assert.equal(soldDraft.sold, true);
  assert.equal(soldDraft.hidden, true);
  assert.equal(soldDraft.draft, true);
});

test('rechecking reduced limits and new active listings reduces the approved selection', () => {
  const candidates = new Set(['a', 'b', 'c']);
  const products = [{ id: 'live', draft: false, sold: false }, ...['a', 'b', 'c', 'd'].map(draft)];
  const plan = planUndraft({ isPremium: true, salesUploadLimit: 2 }, products, candidates);
  assert.deepEqual(plan.selected.map(p => p.id), ['a']);
  assert.equal(plan.skipped, 2);
  assert.equal(planUndraft({ isPremium: false }, products, candidates).selected.length, 0);
});

test('missing legacy flags cannot bypass the allowance', () => {
  const plan = planUndraft({ isPremium: true, salesUploadLimit: 1 }, [{ id: 'legacy' }, draft('a')]);
  assert.equal(plan.active, 1);
  assert.equal(plan.selected.length, 0);
});
