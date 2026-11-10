# Photos and AI builder: what was built

> Build record for agents. Not shown to Adi. Written 2026-11-09 after the work, so every box is ticked or marked open.

**Goal:** Stop Plinth looking AI-made (real photos, finished examples) and add a chat that builds the page with Gemini, using each person's own free key.

**Not in scope (Adi adds these later):** Supabase, Vercel deploy, Stripe, login. Nothing leaves the browser except requests to Google's Gemini API.

## Global constraints

- Next.js 16.4.6: read `node_modules/next/dist/docs/` before using any Next API. Builder code is client components and plain browser APIs only.
- UI is Astryx (`@astryxdesign/core@0.7.11`), one import path per component.
- The Gemini key goes in the `x-goog-api-key` header only. Never in a URL, an error string or a log.
- The model never sets or sees images. People add photos themselves.
- Checks: `pnpm test`, `npx tsc --noEmit`, `pnpm lint`, `pnpm build`.

## Files

| File | Job |
|---|---|
| `src/lib/portfolio.ts` | Section and theme types, `createSection` |
| `src/lib/samples.ts` | Three finished people: `designer`, `engineer`, `illustrator` |
| `src/lib/imageStore.ts` | Uploaded photos in IndexedDB. Swap `saveImage` and `load` for cloud storage later |
| `src/lib/builderTools.ts` | The five tools, `applyToolCall`, `replayCalls`, `builderInstructions` |
| `src/lib/gemini.ts` | `listModels`, `pickModel`, `runBuilderTurn`, plain-word errors |
| `src/lib/useBuilder.ts` | Key and model in localStorage, chat turns, `pending` preview, one undo step per message |
| `src/components/BuilderChat.tsx` | Key setup screen and the chat |
| `src/components/Editor.tsx` | Studio. Left panel tabs: Build with AI, Sections. Phone: bottom sheet with AI, Sections, Theme |
| `src/components/PortfolioView.tsx` | Renders sections. Empty headings are not rendered |
| `src/components/landing/*` | Home page: hero demo of the three people, examples, themes, FAQ |
| `public/samples/` | Sample photos and cover art |

## Tools the model can call

`add_section`, `update_section`, `move_section`, `remove_section`, `set_theme`. Each returns `{ok, message, label}`; `label` is what the chat shows ("Added Projects").

## Behaviour that must stay true

- One chat message = one undo step, however many tool calls it made.
- Hand edits made while the AI is working are kept: the AI's calls are replayed on top (`replayCalls`).
- On an error or Stop, changes already made are kept and the chat says so.
- At most 8 rounds per message, and the last 6 exchanges are remembered.
- A bad key is rejected at setup and nothing is stored.

## Status

- [x] 36 unit tests pass (11 `gemini.test.ts`, 25 `builderTools.test.ts`), with Google replaced by a stand-in
- [x] Type check, lint and production build pass
- [x] Seen in the browser: key setup, bad-key message (setup and chat), chat layout, Remove my key, photo picker, gallery, three samples, phone layout, home page at 1440 and 375 wide
- [ ] A real build with a real Gemini key. Only Adi can type his key, so this is unverified
- [ ] Photos for the engineer and illustrator samples. Waiting on Adi to pick a photo style (A, B or C)

## localStorage keys

`astry-portfolio:draft:v1`, `plinth:gemini-key`, `plinth:gemini-model`, `plinth:gemini-models`.
