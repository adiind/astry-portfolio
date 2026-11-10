/** Where the studio draft is saved: one key per signed-in person. */
export function draftKeyFor(baseKey: string, userId: string | null | undefined): string {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

/**
 * The first time a signed-in person opens the studio, adopt the old un-keyed
 * draft as theirs and remove it, so it is claimed once and no work is lost.
 * Returns the key to read and write.
 */
export function adoptLegacyDraft(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  baseKey: string,
  userId: string | null | undefined,
): string {
  const key = draftKeyFor(baseKey, userId);
  if (key === baseKey) return key;
  try {
    const legacy = storage.getItem(baseKey);
    if (legacy !== null && storage.getItem(key) === null) {
      storage.setItem(key, legacy);
      storage.removeItem(baseKey);
    }
  } catch {
    // Storage can be blocked (private window). The editor still works.
  }
  return key;
}
