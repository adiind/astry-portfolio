'use client';

// Uploaded photos live in this browser's own database (IndexedDB), not on a
// server. Everything goes through this one file, so swapping in real cloud
// storage later means changing only saveImage and load.

import {useEffect, useSyncExternalStore} from 'react';
import type {ImageRef} from './portfolio';

const DB_NAME = 'plinth-images';
const STORE = 'images';
const PREFIX = 'idb:';
const MAX_SIDE = 1600;

export const isUploaded = (ref: ImageRef) => ref.startsWith(PREFIX);

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const req = work(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Shrinks big photos so a phone picture doesn't fill the browser's storage. */
async function shrink(file: File): Promise<Blob> {
  // Vector art and animations are kept as they are.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    // JPEG has no see-through pixels, so paint white behind the picture first.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(done => canvas.toBlob(done, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Saves a picked file and returns the short reference to store in the portfolio. */
export async function saveImage(file: File): Promise<ImageRef> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not a picture.');
  const blob = await shrink(file);
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await run('readwrite', store => store.put(blob, id));
  const ref = PREFIX + id;
  urls.set(ref, URL.createObjectURL(blob));
  return ref;
}

// ref -> a URL an <img> can show. null means "looked, and it is gone".
const urls = new Map<ImageRef, string | null>();
const loading = new Set<ImageRef>();
const listeners = new Set<() => void>();

function load(ref: ImageRef) {
  if (urls.has(ref) || loading.has(ref)) return;
  loading.add(ref);
  run<Blob | undefined>('readonly', store => store.get(ref.slice(PREFIX.length)))
    .then(blob => urls.set(ref, blob ? URL.createObjectURL(blob) : null))
    .catch(() => urls.set(ref, null))
    .finally(() => {
      loading.delete(ref);
      listeners.forEach(notify => notify());
    });
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/**
 * Turns an image reference into something an <img> can show.
 * Returns null while an uploaded photo is loading, or when there is no image.
 */
export function useImageSrc(ref: ImageRef | undefined): string | null {
  const uploaded = !!ref && isUploaded(ref);
  const stored = useSyncExternalStore(
    subscribe,
    () => (uploaded ? (urls.get(ref) ?? null) : null),
    () => null,
  );
  useEffect(() => {
    if (uploaded) load(ref);
  }, [uploaded, ref]);
  if (!ref) return null;
  return uploaded ? stored : ref;
}
