'use client';

import {useCallback, useRef, useState} from 'react';

const MAX_STEPS = 100;
// Changes to the same field within this window merge into one undo step,
// so typing a sentence undoes as one step, not letter by letter.
const MERGE_MS = 800;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface History<T> {
  present: T;
  /** `mergeKey` groups rapid edits to the same thing (e.g. one text field). */
  set: (next: T | ((prev: T) => T), mergeKey?: string) => void;
  undo: () => void;
  redo: () => void;
  /** Replace everything and clear history (e.g. "Start over"). */
  reset: (next: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory<T>(initial: T | (() => T)): History<T> {
  const [state, setState] = useState<HistoryState<T>>(() => ({
    past: [],
    present: typeof initial === 'function' ? (initial as () => T)() : initial,
    future: [],
  }));
  const last = useRef<{key?: string; at: number}>({at: 0});

  const set = useCallback((next: T | ((prev: T) => T), mergeKey?: string) => {
    const now = Date.now();
    const shouldMerge =
      mergeKey !== undefined && last.current.key === mergeKey && now - last.current.at < MERGE_MS;
    last.current = {key: mergeKey, at: now};

    setState(s => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next;
      if (Object.is(value, s.present)) return s;
      if (shouldMerge) return {...s, present: value, future: []};
      return {
        past: [...s.past, s.present].slice(-MAX_STEPS),
        present: value,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = {at: 0};
    setState(s =>
      s.past.length === 0
        ? s
        : {past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future]},
    );
  }, []);

  const redo = useCallback(() => {
    last.current = {at: 0};
    setState(s =>
      s.future.length === 0
        ? s
        : {past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1)},
    );
  }, []);

  const reset = useCallback((next: T) => {
    last.current = {at: 0};
    setState({past: [], present: next, future: []});
  }, []);

  return {
    present: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
