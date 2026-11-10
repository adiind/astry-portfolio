// Talks to Google's Gemini from the browser, using the person's own key.
// The key travels in a request header only: never in a web address, never in
// an error message.

import {
  applyToolCall,
  builderInstructions,
  TOOL_DECLARATIONS,
  type AppliedCall,
  type ToolCall,
  type ToolResult,
} from './builderTools';
import type {Portfolio} from './portfolio';

const API = 'https://generativelanguage.googleapis.com/v1beta';

/** The AI may ask for changes this many times in a row before it must answer. */
const MAX_ROUNDS = 8;
/** How many past messages from the person the AI is reminded of. */
const MAX_REMEMBERED_TURNS = 6;

type FetchFn = typeof fetch;

/** One piece of a Gemini message. Unknown fields are kept and sent back as they came. */
interface Part {
  text?: string;
  thought?: boolean;
  functionCall?: {name: string; args?: Record<string, unknown>; id?: string};
  functionResponse?: {name: string; response: Record<string, unknown>; id?: string};
  [extra: string]: unknown;
}
export interface Content {
  role: 'user' | 'model';
  parts: Part[];
}

export interface GeminiModel {
  id: string;
  label: string;
}

export type GeminiErrorKind = 'key' | 'limit' | 'model' | 'busy' | 'network' | 'blocked' | 'other';

/** An error whose message is already safe and plain enough to show. */
export class GeminiError extends Error {
  kind: GeminiErrorKind;
  constructor(kind: GeminiErrorKind, message: string) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind;
  }
}

export const isStop = (e: unknown) => e instanceof Error && e.name === 'AbortError';

async function call(
  key: string,
  path: string,
  init: {method: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal},
  fetchFn: FetchFn,
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetchFn(`${API}/${path}`, {
      method: init.method,
      headers: {'x-goog-api-key': key, ...(init.body ? {'Content-Type': 'application/json'} : {})},
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
    });
  } catch (e) {
    if (isStop(e)) throw e;
    throw new GeminiError('network', 'Could not reach Google. Check your internet and try again.');
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // An empty or broken reply is handled by the status check below.
  }
  if (res.ok) return data;

  const detail = (data.error as {message?: string; status?: string} | undefined) ?? {};
  const text = `${detail.status ?? ''} ${detail.message ?? ''}`;
  if (res.status === 401 || res.status === 403 || /API[_ ]KEY|api key/i.test(text)) {
    throw new GeminiError('key', 'That key did not work. Check that you copied all of it.');
  }
  if (res.status === 429) {
    throw new GeminiError('limit', 'Free limit reached. Wait a minute and try again.');
  }
  if (res.status === 404) {
    throw new GeminiError('model', 'That AI model is not available for this key. Pick another one.');
  }
  if (res.status >= 500) {
    throw new GeminiError('busy', 'Google\'s AI is busy right now. Try again in a moment.');
  }
  // Whatever Google said, the key must never be repeated on screen.
  const safe = (detail.message ?? '').split(key).join('[key]').slice(0, 200);
  throw new GeminiError('other', `Google refused the request (${res.status}). ${safe}`.trim());
}

/** The Gemini models this key can use for chat. Doubles as "is this key real?". */
export async function listModels(key: string, fetchFn: FetchFn = fetch): Promise<GeminiModel[]> {
  const data = await call(key, 'models?pageSize=200', {method: 'GET'}, fetchFn);
  const models = (data.models as {name?: string; displayName?: string; supportedGenerationMethods?: string[]}[]) ?? [];
  return models
    .filter(m => m.name && m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => ({id: m.name!.replace(/^models\//, ''), label: m.displayName ?? m.name!}))
    .filter(m => /^gemini-/.test(m.id) && !/(embedding|image|tts|audio|live|vision|computer-use|robotics)/.test(m.id));
}

const PREFERRED = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];

/** Picks a quick, free-plan-friendly model from what the key offers. */
export function pickModel(models: GeminiModel[]): string {
  const ids = models.map(m => m.id);
  return (
    PREFERRED.find(id => ids.includes(id)) ??
    ids.find(id => id.includes('flash') && !id.includes('preview')) ??
    ids.find(id => id.includes('flash')) ??
    ids[0] ??
    PREFERRED[0]
  );
}

export interface BuilderStep {
  call: ToolCall;
  result: ToolResult;
  /** The page after this step. */
  portfolio: Portfolio;
  /** Every change that worked so far in this turn. */
  applied: AppliedCall[];
}

export interface BuilderTurnInput {
  key: string;
  model: string;
  /** Earlier messages, as returned by the last turn. */
  history: Content[];
  userText: string;
  portfolio: Portfolio;
  onStep?: (step: BuilderStep) => void;
  signal?: AbortSignal;
  fetchFn?: FetchFn;
}

export interface BuilderTurnOutput {
  history: Content[];
  portfolio: Portfolio;
  /** What the AI said at the end. */
  text: string;
  applied: AppliedCall[];
}

/** Keeps only the last few exchanges, cutting at the start of a person's message. */
function trimHistory(history: Content[]): Content[] {
  const starts = history
    .map((c, i) => (c.role === 'user' && c.parts.some(p => typeof p.text === 'string') ? i : -1))
    .filter(i => i >= 0);
  if (starts.length <= MAX_REMEMBERED_TURNS) return history;
  return history.slice(starts[starts.length - MAX_REMEMBERED_TURNS]);
}

/**
 * One message from the person, start to finish:
 * send it, carry out whatever changes the AI asks for, tell the AI how each
 * went, and repeat until it answers in words.
 */
export async function runBuilderTurn(input: BuilderTurnInput): Promise<BuilderTurnOutput> {
  const {key, model, userText, onStep, signal, fetchFn = fetch} = input;
  const contents: Content[] = [...input.history, {role: 'user', parts: [{text: userText}]}];
  const applied: AppliedCall[] = [];
  let portfolio = input.portfolio;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const data = await call(
      key,
      `models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        signal,
        body: {
          // Rebuilt every round, so the AI always reads the page as it is now.
          systemInstruction: {parts: [{text: builderInstructions(portfolio)}]},
          contents,
          tools: [{functionDeclarations: TOOL_DECLARATIONS}],
        },
      },
      fetchFn,
    );

    const blocked = (data.promptFeedback as {blockReason?: string} | undefined)?.blockReason;
    if (blocked) {
      throw new GeminiError('blocked', 'Google\'s safety filter stopped that message. Try wording it differently.');
    }
    const candidate = (data.candidates as {content?: Content; finishReason?: string}[] | undefined)?.[0];
    const parts = candidate?.content?.parts ?? [];
    if (parts.length === 0) {
      throw new GeminiError(
        candidate?.finishReason === 'SAFETY' ? 'blocked' : 'other',
        candidate?.finishReason === 'SAFETY'
          ? 'Google\'s safety filter stopped the answer. Try wording it differently.'
          : 'The AI sent back an empty answer. Try asking again.',
      );
    }

    // The AI's message goes back exactly as it came. Gemini attaches hidden
    // "signature" fields to it and refuses the next request if they are missing.
    contents.push({role: 'model', parts});

    const calls = parts.filter(p => p.functionCall);
    if (calls.length === 0) {
      const text = parts
        .filter(p => typeof p.text === 'string' && !p.thought)
        .map(p => p.text)
        .join('')
        .trim();
      return {history: trimHistory(contents), portfolio, text: text || 'Done.', applied};
    }

    const responses: Part[] = [];
    for (const part of calls) {
      const fc = part.functionCall!;
      const toolCall: ToolCall = {name: fc.name, args: fc.args ?? {}};
      const out = applyToolCall(portfolio, toolCall);
      portfolio = out.portfolio;
      if (out.result.ok) applied.push({call: toolCall, sectionId: out.sectionId});
      onStep?.({call: toolCall, result: out.result, portfolio, applied: [...applied]});
      responses.push({
        functionResponse: {
          name: fc.name,
          response: {ok: out.result.ok, message: out.result.message},
          ...(fc.id ? {id: fc.id} : {}),
        },
      });
    }
    contents.push({role: 'user', parts: responses});
  }

  // Out of rounds. Close the exchange with a message from the AI's side, so
  // the saved conversation still takes turns properly.
  const text = 'I made a lot of changes and stopped there. Have a look, then tell me what to do next.';
  contents.push({role: 'model', parts: [{text}]});
  return {history: trimHistory(contents), portfolio, text, applied};
}
