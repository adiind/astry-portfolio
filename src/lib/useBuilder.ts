'use client';

// The "Build with AI" chat's brain: keeps the person's Gemini key in this
// browser, sends their messages, and hands the page changes back to the editor.

import {useCallback, useRef, useState} from 'react';
import {replayCalls, type AppliedCall} from './builderTools';
import {adoptLegacyDraft, draftKeyFor} from './draftKey';
import {GeminiError, isStop, listModels, pickModel, runBuilderTurn, type Content, type GeminiModel} from './gemini';
import type {Portfolio} from './portfolio';

const KEY_STORE = 'plinth:gemini-key';
const MODEL_STORE = 'plinth:gemini-model';
const MODELS_STORE = 'plinth:gemini-models';

export interface BuilderStepView {
  /** Short words for the person, like "Added Projects". */
  label: string;
  ok: boolean;
}

export interface BuilderTurn {
  id: string;
  userText: string;
  steps: BuilderStepView[];
  /** What the AI said at the end. */
  reply: string;
  status: 'working' | 'done' | 'error' | 'stopped';
  error?: string;
}

/** Changes made so far by a message that is still being worked on. */
export interface PendingBuild {
  /** The page as it was when the message was sent. */
  base: Portfolio;
  /** That page with the AI's changes so far. */
  working: Portfolio;
  applied: AppliedCall[];
}

export interface BuilderOptions {
  /** The page as it is right now. */
  getPortfolio: () => Portfolio;
  /** Saves a finished message's changes as one undo step. */
  commit: (update: (current: Portfolio) => Portfolio) => void;
  /** The signed-in person. Their key is kept apart from other people's in this browser. */
  userId: string;
}

function read(name: string): string {
  try {
    return localStorage.getItem(name) ?? '';
  } catch {
    return '';
  }
}
function write(name: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(name);
    else localStorage.setItem(name, value);
  } catch {
    // Storage can be blocked (private window). The key then lasts until the tab closes.
  }
}
// A key saved before sign-in existed moves to the first person who signs in.
function ownStore(name: string, userId: string): string {
  try {
    return adoptLegacyDraft(localStorage, name, userId);
  } catch {
    return draftKeyFor(name, userId);
  }
}
function readModels(store: string): GeminiModel[] {
  try {
    const list = JSON.parse(read(store) || '[]') as GeminiModel[];
    return Array.isArray(list) ? list.filter(m => typeof m?.id === 'string') : [];
  } catch {
    return [];
  }
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function useBuilder({getPortfolio, commit, userId}: BuilderOptions) {
  const [stores] = useState(() => ({
    key: ownStore(KEY_STORE, userId),
    model: ownStore(MODEL_STORE, userId),
    models: ownStore(MODELS_STORE, userId),
  }));
  const [key, setKey] = useState(() => read(stores.key));
  const [models, setModels] = useState<GeminiModel[]>(() => readModels(stores.models));
  const [model, setModelState] = useState(() => read(stores.model));
  const [turns, setTurns] = useState<BuilderTurn[]>([]);
  const [pending, setPending] = useState<PendingBuild | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  // What the AI is reminded of from earlier messages. Not shown, so not state.
  const memory = useRef<Content[]>([]);
  const stopper = useRef<AbortController | null>(null);

  /** Checks the key with Google, then keeps it in this browser. */
  const saveKey = useCallback(async (raw: string): Promise<string | null> => {
    const candidate = raw.trim();
    if (!candidate) return 'Paste your key first.';
    try {
      const found = await listModels(candidate);
      const chosen = pickModel(found);
      write(stores.key, candidate);
      write(stores.models, JSON.stringify(found));
      write(stores.model, chosen);
      setKey(candidate);
      setModels(found);
      setModelState(chosen);
      return null;
    } catch (e) {
      return e instanceof GeminiError ? e.message : 'Could not check the key. Try again.';
    }
  }, [stores]);

  const clear = useCallback(() => {
    stopper.current?.abort();
    memory.current = [];
    setTurns([]);
  }, []);

  const removeKey = useCallback(() => {
    clear();
    write(stores.key, null);
    write(stores.model, null);
    write(stores.models, null);
    setKey('');
    setModels([]);
    setModelState('');
  }, [clear, stores]);

  const setModel = useCallback((id: string) => {
    write(stores.model, id);
    setModelState(id);
  }, [stores]);

  const stop = useCallback(() => stopper.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || !key || stopper.current) return;

      const id = newId();
      const base = getPortfolio();
      const controller = new AbortController();
      stopper.current = controller;
      // Kept outside React state so a stop or an error can still save them.
      let working = base;
      let applied: AppliedCall[] = [];

      const patch = (change: (turn: BuilderTurn) => BuilderTurn) =>
        setTurns(all => all.map(turn => (turn.id === id ? change(turn) : turn)));
      // One undo step for the whole message. If the person edited by hand in
      // the meantime, the AI's changes are redone on top of their edits.
      const save = () => {
        if (applied.length > 0) {
          const result = working;
          const calls = applied;
          commit(current => (current === base ? result : replayCalls(current, calls)));
        }
        setPending(null);
      };

      setTurns(all => [...all, {id, userText, steps: [], reply: '', status: 'working'}]);
      setPending({base, working: base, applied: []});
      setIsWorking(true);

      try {
        const out = await runBuilderTurn({
          key,
          model: model || pickModel(models),
          history: memory.current,
          userText,
          portfolio: base,
          signal: controller.signal,
          onStep: step => {
            working = step.portfolio;
            applied = step.applied;
            setPending({base, working, applied});
            patch(turn => ({...turn, steps: [...turn.steps, {label: step.result.label, ok: step.result.ok}]}));
          },
        });
        memory.current = out.history;
        working = out.portfolio;
        applied = out.applied;
        save();
        patch(turn => ({...turn, reply: out.text, status: 'done'}));
      } catch (e) {
        // Whatever was already built stays. The half-finished exchange is not
        // remembered, so the next message starts clean.
        save();
        const kept = applied.length > 0 ? ' The changes made so far are kept. Undo removes them.' : '';
        if (isStop(e)) {
          patch(turn => ({...turn, status: 'stopped', reply: `Stopped.${kept}`}));
        } else {
          const why = e instanceof GeminiError ? e.message : 'Something went wrong. Try again.';
          patch(turn => ({...turn, status: 'error', error: `${why}${kept}`}));
        }
      } finally {
        stopper.current = null;
        setIsWorking(false);
      }
    },
    [key, model, models, getPortfolio, commit],
  );

  return {
    hasKey: key !== '',
    models,
    model: model || pickModel(models),
    setModel,
    saveKey,
    removeKey,
    turns,
    isWorking,
    send,
    stop,
    clear,
    pending,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
