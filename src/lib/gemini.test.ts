import {describe, expect, it} from 'vitest';
import {GeminiError, listModels, pickModel, runBuilderTurn, type Content} from './gemini';
import {createSection, type Portfolio} from './portfolio';

// A made-up key. No real request leaves this file: fetch is replaced below.
const KEY = 'test-key-not-real-123';

const portfolio: Portfolio = {
  sections: [{...createSection('hero'), id: 'hero-1'}],
  theme: {preset: 'neutral', accent: null, fonts: 'theme', roundness: null, spacing: 'normal', textSize: null, mode: 'light'},
};

interface Sent {
  url: string;
  headers: Record<string, string>;
  body: {contents: Content[]; systemInstruction: {parts: {text: string}[]}; tools: unknown[]};
}

/** A stand-in for Google: answers with the given replies, one per request. */
function fakeGoogle(replies: {status?: number; body: unknown}[]) {
  const sent: Sent[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    sent.push({
      url,
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    const reply = replies[sent.length - 1];
    if (!reply) throw new Error('more requests than expected');
    return new Response(JSON.stringify(reply.body), {status: reply.status ?? 200});
  }) as unknown as typeof fetch;
  return {sent, fetchFn};
}

const modelSays = (parts: unknown[]) => ({body: {candidates: [{content: {role: 'model', parts}}]}});

describe('runBuilderTurn', () => {
  it('carries out the changes the AI asks for, reports back, and returns its answer', async () => {
    const askParts = [
      {
        functionCall: {name: 'update_section', id: 'call-7', args: {sectionId: 'hero-1', content: {name: 'Sam Rivera'}}},
        thoughtSignature: 'sig-abc',
      },
      {functionCall: {name: 'set_theme', args: {preset: 'matcha'}}},
    ];
    const {sent, fetchFn} = fakeGoogle([modelSays(askParts), modelSays([{text: 'Renamed you and went green.'}])]);
    const steps: string[] = [];

    const out = await runBuilderTurn({
      key: KEY,
      model: 'gemini-test',
      history: [],
      userText: 'Call me Sam and make it green',
      portfolio,
      fetchFn,
      onStep: s => steps.push(s.result.label),
    });

    expect(out.text).toBe('Renamed you and went green.');
    expect(out.portfolio.sections[0]).toMatchObject({name: 'Sam Rivera'});
    expect(out.portfolio.theme.preset).toBe('matcha');
    expect(out.applied).toHaveLength(2);
    expect(steps).toEqual(['Changed Hero', 'Changed the look']);

    // The key goes in the header and nowhere else.
    expect(sent).toHaveLength(2);
    expect(sent[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
    expect(sent[0].headers['x-goog-api-key']).toBe(KEY);
    expect(JSON.stringify(sent.map(s => [s.url, s.body]))).not.toContain(KEY);

    // First request: the person's words plus the page as it was.
    expect(sent[0].body.contents).toEqual([{role: 'user', parts: [{text: 'Call me Sam and make it green'}]}]);
    expect(sent[0].body.systemInstruction.parts[0].text).toContain('"name":"Your name"');

    // Second request: the AI's message sent back untouched, then one result per change.
    const second = sent[1].body.contents;
    expect(second[1]).toEqual({role: 'model', parts: askParts});
    expect(second[2].role).toBe('user');
    expect(second[2].parts.map(p => p.functionResponse)).toMatchObject([
      {name: 'update_section', id: 'call-7', response: {ok: true}},
      {name: 'set_theme', response: {ok: true}},
    ]);
    expect(second[2].parts[1].functionResponse).not.toHaveProperty('id');
    // ...and the page description is fresh.
    expect(sent[1].body.systemInstruction.parts[0].text).toContain('"name":"Sam Rivera"');

    // The saved conversation ends with the AI's words, ready for the next message.
    expect(out.history).toHaveLength(4);
    expect(out.history[3]).toEqual({role: 'model', parts: [{text: 'Renamed you and went green.'}]});
  });

  it('tells the AI when a change could not be made, and does not record it', async () => {
    const {sent, fetchFn} = fakeGoogle([
      modelSays([{functionCall: {name: 'remove_section', args: {sectionId: 'nope'}}}]),
      modelSays([{text: 'I could not find that section.'}]),
    ]);
    const out = await runBuilderTurn({key: KEY, model: 'm', history: [], userText: 'x', portfolio, fetchFn});
    expect(out.applied).toEqual([]);
    expect(out.portfolio).toBe(portfolio);
    expect(sent[1].body.contents[2].parts[0].functionResponse?.response).toMatchObject({ok: false});
  });

  it('leaves out the AI\'s private thinking from the answer', async () => {
    const {fetchFn} = fakeGoogle([modelSays([{text: 'hmm, plan...', thought: true}, {text: 'All set.'}])]);
    const out = await runBuilderTurn({key: KEY, model: 'm', history: [], userText: 'x', portfolio, fetchFn});
    expect(out.text).toBe('All set.');
  });

  it('stops after a fixed number of rounds if the AI never answers in words', async () => {
    const loop = modelSays([{functionCall: {name: 'set_theme', args: {spacing: 'airy'}}}]);
    const {sent, fetchFn} = fakeGoogle(Array(20).fill(loop));
    const out = await runBuilderTurn({key: KEY, model: 'm', history: [], userText: 'x', portfolio, fetchFn});
    expect(sent).toHaveLength(8);
    expect(out.text).toContain('stopped there');
    expect(out.history[out.history.length - 1].role).toBe('model');
  });

  it('forgets the oldest exchanges once the conversation gets long', async () => {
    let history: Content[] = [];
    for (let i = 0; i < 9; i++) {
      const {fetchFn} = fakeGoogle([modelSays([{text: `answer ${i}`}])]);
      history = (await runBuilderTurn({key: KEY, model: 'm', history, userText: `message ${i}`, portfolio, fetchFn}))
        .history;
    }
    expect(history).toHaveLength(12);
    expect(history[0]).toEqual({role: 'user', parts: [{text: 'message 3'}]});
  });

  it('turns Google\'s errors into plain words, without the key', async () => {
    const cases: [number, unknown, string, string][] = [
      [400, {error: {status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.'}}, 'key', 'did not work'],
      [403, {error: {message: 'Permission denied'}}, 'key', 'did not work'],
      [429, {error: {message: 'Quota exceeded'}}, 'limit', 'Free limit reached'],
      [404, {error: {message: 'models/x is not found'}}, 'model', 'Pick another'],
      [503, {error: {message: 'overloaded'}}, 'busy', 'busy'],
      [400, {error: {message: `Bad request for key ${KEY}`}}, 'other', 'refused'],
    ];
    for (const [status, body, kind, words] of cases) {
      const {fetchFn} = fakeGoogle([{status, body}]);
      const error = await runBuilderTurn({key: KEY, model: 'm', history: [], userText: 'x', portfolio, fetchFn}).catch(
        e => e,
      );
      expect(error).toBeInstanceOf(GeminiError);
      expect(error.kind).toBe(kind);
      expect(error.message).toContain(words);
      expect(error.message).not.toContain(KEY);
    }
  });

  it('explains a blocked message, an empty answer, and no internet', async () => {
    const run = (fetchFn: typeof fetch) =>
      runBuilderTurn({key: KEY, model: 'm', history: [], userText: 'x', portfolio, fetchFn}).catch(e => e);

    const blocked = await run(fakeGoogle([{body: {promptFeedback: {blockReason: 'SAFETY'}}}]).fetchFn);
    expect(blocked.kind).toBe('blocked');
    const empty = await run(fakeGoogle([{body: {candidates: [{finishReason: 'MALFORMED_FUNCTION_CALL'}]}}]).fetchFn);
    expect(empty.message).toContain('empty answer');
    const offline = await run((async () => {
      throw new TypeError(`Failed to fetch with ${KEY}`);
    }) as unknown as typeof fetch);
    expect(offline.kind).toBe('network');
    expect(offline.message).not.toContain(KEY);
  });

  it('lets a stop request through as a stop, not an error message', async () => {
    const stopped = await runBuilderTurn({
      key: KEY,
      model: 'm',
      history: [],
      userText: 'x',
      portfolio,
      fetchFn: (async () => {
        throw new DOMException('stopped', 'AbortError');
      }) as unknown as typeof fetch,
    }).catch(e => e);
    expect(stopped).not.toBeInstanceOf(GeminiError);
    expect(stopped.name).toBe('AbortError');
  });
});

describe('listModels and pickModel', () => {
  it('keeps only chat models and puts the key in the header', async () => {
    const {sent, fetchFn} = fakeGoogle([
      {
        body: {
          models: [
            {name: 'models/gemini-3.5-flash-lite', displayName: 'Flash Lite', supportedGenerationMethods: ['generateContent']},
            {name: 'models/gemini-3.8-flash', displayName: 'Flash', supportedGenerationMethods: ['generateContent']},
            {name: 'models/gemini-embedding-2', supportedGenerationMethods: ['embedContent']},
            {name: 'models/gemini-3-flash-image', supportedGenerationMethods: ['generateContent']},
            {name: 'models/gemma-4', supportedGenerationMethods: ['generateContent']},
          ],
        },
      },
    ]);
    const models = await listModels(KEY, fetchFn);
    expect(models).toEqual([
      {id: 'gemini-3.5-flash-lite', label: 'Flash Lite'},
      {id: 'gemini-3.8-flash', label: 'Flash'},
    ]);
    expect(sent[0].url).not.toContain(KEY);
    expect(sent[0].headers['x-goog-api-key']).toBe(KEY);
    expect(pickModel(models)).toBe('gemini-3.5-flash-lite');
  });

  it('falls back to any flash model, then to anything', () => {
    expect(pickModel([{id: 'gemini-9-pro', label: ''}, {id: 'gemini-9-flash', label: ''}])).toBe('gemini-9-flash');
    expect(pickModel([{id: 'gemini-9-pro', label: ''}])).toBe('gemini-9-pro');
    expect(pickModel([])).toBe('gemini-3.5-flash-lite');
  });

  it('reports a bad key', async () => {
    const {fetchFn} = fakeGoogle([{status: 400, body: {error: {message: 'API key not valid.'}}}]);
    await expect(listModels(KEY, fetchFn)).rejects.toMatchObject({kind: 'key'});
  });
});
