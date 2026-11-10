import {describe, expect, it} from 'vitest';
import {
  applyToolCall,
  builderInstructions,
  describePortfolio,
  replayCalls,
  safeUrl,
  TOOL_DECLARATIONS,
  type AppliedCall,
} from './builderTools';
import {createSection, type Portfolio, type ProjectsSection} from './portfolio';
import type {ThemeSettings} from './themes';

const theme: ThemeSettings = {
  preset: 'neutral',
  accent: null,
  fonts: 'theme',
  roundness: null,
  spacing: 'normal',
  textSize: null,
  mode: 'light',
};

function start(): Portfolio {
  const hero = {...createSection('hero'), id: 'hero-1', photo: '/samples/me.webp'};
  const projects = {
    ...createSection('projects'),
    id: 'projects-1',
    items: [
      {id: 'p-1', title: 'Old title', description: 'Old words', tags: ['a'], url: '', image: 'idb:photo-1'},
      {id: 'p-2', title: 'Second', description: 'More', tags: [], url: '', image: ''},
    ],
  } as Portfolio['sections'][number];
  return {sections: [hero, projects], theme};
}

const projectsOf = (p: Portfolio) => p.sections.find(s => s.type === 'projects') as ProjectsSection & {id: string};

describe('add_section', () => {
  it('adds a section at the bottom with the given words', () => {
    const out = applyToolCall(start(), {
      name: 'add_section',
      args: {type: 'text', layout: 'centered', content: {heading: 'Hello', body: 'World'}},
    });
    expect(out.result.ok).toBe(true);
    expect(out.portfolio.sections).toHaveLength(3);
    const added = out.portfolio.sections[2];
    expect(added).toMatchObject({type: 'text', layout: 'centered', heading: 'Hello', body: 'World'});
    expect(out.sectionId).toBe(added.id);
    expect(out.result.message).toContain(added.id);
    expect(out.result.label).toBe('Added Text');
  });

  it('puts it at the asked position', () => {
    const out = applyToolCall(start(), {name: 'add_section', args: {type: 'stats', position: 1}});
    expect(out.portfolio.sections.map(s => s.type)).toEqual(['hero', 'stats', 'projects']);
  });

  it('replaces the placeholder entries when entries are given', () => {
    const out = applyToolCall(start(), {
      name: 'add_section',
      args: {type: 'stats', content: {items: [{value: '12', label: 'Shows'}]}},
    });
    const stats = out.portfolio.sections[2];
    expect(stats.type === 'stats' && stats.items.map(i => [i.value, i.label])).toEqual([['12', 'Shows']]);
  });

  it('refuses an unknown type or layout and changes nothing', () => {
    const p = start();
    const badType = applyToolCall(p, {name: 'add_section', args: {type: 'carousel'}});
    expect(badType.result.ok).toBe(false);
    expect(badType.portfolio).toBe(p);
    const badLayout = applyToolCall(p, {name: 'add_section', args: {type: 'text', layout: 'mosaic'}});
    expect(badLayout.result.ok).toBe(false);
    expect(badLayout.result.message).toContain('left, centered');
    expect(badLayout.portfolio).toBe(p);
  });
});

describe('update_section', () => {
  it('changes words and keeps the photo', () => {
    const out = applyToolCall(start(), {
      name: 'update_section',
      args: {sectionId: 'hero-1', layout: 'split', content: {name: 'Sam Rivera', photo: 'https://evil.example/x.png'}},
    });
    expect(out.result.ok).toBe(true);
    expect(out.portfolio.sections[0]).toMatchObject({name: 'Sam Rivera', layout: 'split', photo: '/samples/me.webp'});
    expect(out.result.message).toContain('Ignored fields');
  });

  it('changes one entry by id and keeps its picture, and adds entries without an id', () => {
    const out = applyToolCall(start(), {
      name: 'update_section',
      args: {
        sectionId: 'projects-1',
        content: {items: [{id: 'p-1', title: 'New title', image: 'https://evil.example/x.png'}, {title: 'Third'}]},
      },
    });
    const items = projectsOf(out.portfolio).items;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({id: 'p-1', title: 'New title', description: 'Old words', image: 'idb:photo-1'});
    expect(items[2]).toMatchObject({title: 'Third', image: ''});
    expect(items[2].id).not.toBe('p-1');
  });

  it('deletes entries by id', () => {
    const out = applyToolCall(start(), {
      name: 'update_section',
      args: {sectionId: 'projects-1', content: {removeItemIds: ['p-2']}},
    });
    expect(projectsOf(out.portfolio).items.map(i => i.id)).toEqual(['p-1']);
  });

  it('hides a section', () => {
    const out = applyToolCall(start(), {name: 'update_section', args: {sectionId: 'projects-1', hidden: true}});
    expect(out.portfolio.sections[1].isHidden).toBe(true);
  });

  it('cuts very long text and long lists down to size', () => {
    const out = applyToolCall(start(), {
      name: 'update_section',
      args: {
        sectionId: 'projects-1',
        content: {
          heading: 'x'.repeat(5000),
          items: Array.from({length: 40}, (_, i) => ({title: `Project ${i}`, tags: Array(30).fill('tag')})),
        },
      },
    });
    const section = projectsOf(out.portfolio);
    expect(section.heading).toHaveLength(2000);
    expect(section.items).toHaveLength(12);
    expect(section.items[5].tags).toHaveLength(12);
  });

  it('refuses an unknown id, a wrong layout, or an empty request', () => {
    const p = start();
    const noId = applyToolCall(p, {name: 'update_section', args: {sectionId: 'nope', hidden: true}});
    expect(noId.result.ok).toBe(false);
    expect(noId.result.message).toContain('hero-1');
    expect(noId.portfolio).toBe(p);
    const layout = applyToolCall(p, {name: 'update_section', args: {sectionId: 'hero-1', layout: 'grid'}});
    expect(layout.result.ok).toBe(false);
    const empty = applyToolCall(p, {name: 'update_section', args: {sectionId: 'hero-1', content: {quote: 'x'}}});
    expect(empty.result.ok).toBe(false);
    expect(empty.portfolio).toBe(p);
  });
});

describe('move_section and remove_section', () => {
  it('moves a section', () => {
    const out = applyToolCall(start(), {name: 'move_section', args: {sectionId: 'projects-1', toIndex: 0}});
    expect(out.portfolio.sections.map(s => s.id)).toEqual(['projects-1', 'hero-1']);
  });

  it('keeps a far-away position on the page', () => {
    const out = applyToolCall(start(), {name: 'move_section', args: {sectionId: 'hero-1', toIndex: 99}});
    expect(out.portfolio.sections.map(s => s.id)).toEqual(['projects-1', 'hero-1']);
  });

  it('removes a section', () => {
    const out = applyToolCall(start(), {name: 'remove_section', args: {sectionId: 'hero-1'}});
    expect(out.portfolio.sections.map(s => s.id)).toEqual(['projects-1']);
    expect(out.result.label).toBe('Removed Hero');
  });
});

describe('set_theme', () => {
  it('changes only the settings given', () => {
    const out = applyToolCall(start(), {
      name: 'set_theme',
      args: {preset: 'matcha', accent: '#ff8800', corners: 'round', textSize: 'larger', mode: 'dark'},
    });
    expect(out.result.ok).toBe(true);
    expect(out.portfolio.theme).toEqual({
      ...theme,
      preset: 'matcha',
      accent: '#FF8800',
      roundness: 2,
      textSize: 'larger',
      mode: 'dark',
    });
  });

  it('"theme" hands a setting back to the look', () => {
    const p = {...start(), theme: {...theme, accent: '#112233', roundness: 0, textSize: 'smaller' as const}};
    const out = applyToolCall(p, {name: 'set_theme', args: {accent: 'theme', corners: 'theme', textSize: 'theme'}});
    expect(out.portfolio.theme).toMatchObject({accent: null, roundness: null, textSize: null});
  });

  it('skips bad values but keeps the good ones', () => {
    const out = applyToolCall(start(), {name: 'set_theme', args: {preset: 'neon', accent: 'red', spacing: 'airy'}});
    expect(out.result.ok).toBe(true);
    expect(out.portfolio.theme).toMatchObject({preset: 'neutral', accent: null, spacing: 'airy'});
    expect(out.result.message).toContain('Skipped');
  });

  it('fails when nothing usable was given', () => {
    const p = start();
    const out = applyToolCall(p, {name: 'set_theme', args: {preset: 'neon'}});
    expect(out.result.ok).toBe(false);
    expect(out.portfolio).toBe(p);
  });

  it('says that the gothic look cannot be light', () => {
    const out = applyToolCall(start(), {name: 'set_theme', args: {preset: 'gothic'}});
    expect(out.result.message).toContain('always dark');
  });
});

describe('safety', () => {
  it('never throws on nonsense', () => {
    const p = start();
    for (const call of [
      {name: 'launch_rocket', args: {}},
      {name: 'add_section', args: null as unknown as Record<string, unknown>},
      {name: 'update_section', args: {sectionId: 42, content: 'words'}},
      {name: 'move_section', args: {sectionId: 'hero-1', toIndex: 'top'}},
      {name: 'update_section', args: {sectionId: 'projects-1', content: {items: 'none', removeItemIds: 7}}},
    ]) {
      const out = applyToolCall(p, call);
      expect(out.result.ok).toBe(false);
      expect(out.portfolio).toBe(p);
    }
  });

  it('only lets ordinary web and email links through', () => {
    expect(safeUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrl('mailto:me@example.com')).toBe('mailto:me@example.com');
    expect(safeUrl('example.com/work')).toBe('https://example.com/work');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('data:text/html,hi')).toBe('');
    expect(safeUrl('not a link')).toBe('');
    expect(safeUrl(12)).toBe('');
  });

  it('cleans links the AI writes into a section', () => {
    const p: Portfolio = {sections: [{...createSection('contact'), id: 'contact-1'}], theme};
    const out = applyToolCall(p, {
      name: 'update_section',
      args: {sectionId: 'contact-1', content: {links: [{label: 'Bad', url: 'javascript:alert(1)'}, {label: 'Good', url: 'linkedin.com/in/x'}]}},
    });
    const contact = out.portfolio.sections[0];
    expect(contact.type === 'contact' && contact.links.map(l => l.url)).toEqual(['', 'https://linkedin.com/in/x']);
  });
});

describe('what the AI is shown', () => {
  it('lists every section with its id and words, and never sends pictures', () => {
    const text = describePortfolio(start());
    const data = JSON.parse(text);
    expect(data.sections.map((s: {id: string}) => s.id)).toEqual(['hero-1', 'projects-1']);
    expect(data.sections[0].content.hasPhoto).toBe(true);
    expect(data.sections[1].content.items[0]).toMatchObject({id: 'p-1', title: 'Old title', hasImage: true});
    expect(data.sections[1].content.items[1].hasImage).toBe(false);
    expect(text).not.toContain('idb:');
    expect(text).not.toContain('/samples/');
    expect(data.theme).toMatchObject({preset: 'neutral', accent: 'theme', corners: 'theme'});
  });

  it('puts the page into the standing instructions', () => {
    expect(builderInstructions(start())).toContain('"id":"hero-1"');
  });

  it('describes five tools in the shape Gemini accepts', () => {
    expect(TOOL_DECLARATIONS.map(t => t.name)).toEqual([
      'add_section',
      'update_section',
      'move_section',
      'remove_section',
      'set_theme',
    ]);
    // Gemini rejects an object type with no listed fields, and lower-case type names.
    const check = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(check);
      if (typeof node !== 'object' || node === null) return;
      const n = node as Record<string, unknown>;
      if (typeof n.type === 'string') {
        expect(n.type).toBe(n.type.toUpperCase());
        if (n.type === 'OBJECT') expect(Object.keys(n.properties as object).length).toBeGreaterThan(0);
        if (n.type === 'ARRAY') expect(n.items).toBeDefined();
      }
      Object.values(n).forEach(check);
    };
    check(TOOL_DECLARATIONS.map(t => t.parameters));
  });
});

describe('replayCalls', () => {
  it('repeats the same changes on a newer portfolio, with the same new section id', () => {
    const base = start();
    const applied: AppliedCall[] = [];
    let working = base;
    for (const call of [
      {name: 'add_section', args: {type: 'text', content: {heading: 'Notes'}}},
      {name: 'set_theme', args: {preset: 'stone'}},
    ]) {
      const out = applyToolCall(working, call);
      working = out.portfolio;
      applied.push({call, sectionId: out.sectionId});
    }
    // Meanwhile the person renamed themselves by hand.
    const edited: Portfolio = {
      ...base,
      sections: base.sections.map(s => (s.id === 'hero-1' ? {...s, name: 'Typed by hand'} : s)),
    };
    const merged = replayCalls(edited, applied);
    expect(merged.sections[0]).toMatchObject({name: 'Typed by hand'});
    expect(merged.sections[2].id).toBe(working.sections[2].id);
    expect(merged.theme.preset).toBe('stone');
  });
});
