import {describe, expect, it} from 'vitest';
import {adoptLegacyDraft, draftKeyFor} from './draftKey';

const BASE = 'draft:v1';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('draftKeyFor', () => {
  it('adds the user id to the base key', () => {
    expect(draftKeyFor(BASE, 'user_1')).toBe('draft:v1:user_1');
  });

  it('falls back to the plain key without a user', () => {
    expect(draftKeyFor(BASE, null)).toBe(BASE);
    expect(draftKeyFor(BASE, undefined)).toBe(BASE);
  });
});

describe('adoptLegacyDraft', () => {
  it('moves the legacy draft to the user key and removes the old one', () => {
    const s = fakeStorage({[BASE]: '{"a":1}'});
    expect(adoptLegacyDraft(s, BASE, 'u1')).toBe('draft:v1:u1');
    expect(s.data.get('draft:v1:u1')).toBe('{"a":1}');
    expect(s.data.has(BASE)).toBe(false);
  });

  it('gives the legacy draft to only the first person', () => {
    const s = fakeStorage({[BASE]: '{"a":1}'});
    adoptLegacyDraft(s, BASE, 'u1');
    adoptLegacyDraft(s, BASE, 'u2');
    expect(s.data.has('draft:v1:u2')).toBe(false);
  });

  it('never overwrites an existing per-user draft', () => {
    const s = fakeStorage({[BASE]: 'old', 'draft:v1:u1': 'mine'});
    adoptLegacyDraft(s, BASE, 'u1');
    expect(s.data.get('draft:v1:u1')).toBe('mine');
  });

  it('does nothing when there is no legacy draft', () => {
    const s = fakeStorage();
    adoptLegacyDraft(s, BASE, 'u1');
    expect(s.data.size).toBe(0);
  });

  it('leaves the legacy draft alone without a user', () => {
    const s = fakeStorage({[BASE]: 'x'});
    expect(adoptLegacyDraft(s, BASE, null)).toBe(BASE);
    expect(s.data.get(BASE)).toBe('x');
  });
});
