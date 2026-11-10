'use client';

import type {CSSProperties} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Layout';
import {Text, Heading} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Selector} from '@astryxdesign/core/Selector';
import {SelectableCard} from '@astryxdesign/core/SelectableCard';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Theme} from '@astryxdesign/core/theme';
import {Icon} from '@astryxdesign/core/Icon';
import {Tooltip} from '@astryxdesign/core/Tooltip';
import {ArrowPathIcon, CheckIcon, MoonIcon, SunIcon} from '@heroicons/react/20/solid';
import {
  ACCENT_SWATCHES,
  DEFAULT_THEME,
  FONT_PAIRS,
  PRESETS,
  type FontPairId,
  type PresetId,
  type Spacing,
  type ThemeSettings,
  effectiveMode,
  isDarkOnly,
} from '@/lib/themes';

// Color swatches are the user's own data colors, so they are painted directly.
const swatchStyle = (color: string, isOn: boolean): CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  backgroundColor: color,
  border: 'none',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  outline: isOn ? '2px solid var(--color-text-primary)' : 'none',
  outlineOffset: 2,
});
const pickerStyle: CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  border: '1px dashed var(--color-border-emphasized)',
  borderRadius: '50%',
  background: 'none',
  cursor: 'pointer',
};

const ROUNDNESS = [
  {value: 'theme', label: 'Auto', n: null},
  {value: '0', label: 'Sharp', n: 0},
  {value: '1', label: 'Soft', n: 1},
  {value: '2', label: 'Round', n: 2},
] as const;

function Group({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <VStack gap={2}>
      <Text type="label" weight="semibold">
        {title}
      </Text>
      {children}
    </VStack>
  );
}

export function ThemePanel({
  value,
  onChange,
}: {
  value: ThemeSettings;
  onChange: (next: ThemeSettings) => void;
}) {
  const set = <K extends keyof ThemeSettings>(key: K, v: ThemeSettings[K]) =>
    onChange({...value, [key]: v});

  return (
    <VStack gap={6}>
      <HStack gap={2} hAlign="between" vAlign="center">
        <Heading level={3}>Theme</Heading>
        <Button
          label="Reset theme"
          variant="ghost"
          size="sm"
          icon={<Icon icon={ArrowPathIcon} size="sm" />}
          onClick={() => onChange(DEFAULT_THEME)}
        />
      </HStack>

      <Group title="Starting point">
        <Grid columns={2} gap={2}>
          {(Object.keys(PRESETS) as PresetId[]).map(id => (
            <SelectableCard
              key={id}
              label={PRESETS[id].label}
              isSelected={value.preset === id}
              onChange={() => set('preset', id)}
              padding={0}>
              <Theme theme={PRESETS[id].theme} mode={isDarkOnly(id) ? 'dark' : value.mode}>
                <Card padding={2} elevation="none">
                  <VStack gap={1.5}>
                    <Text type="label" weight="semibold">
                      {PRESETS[id].label}
                    </Text>
                    <Button label="Aa" variant="primary" size="sm" />
                  </VStack>
                </Card>
              </Theme>
            </SelectableCard>
          ))}
        </Grid>
      </Group>

      <Group title="Accent color">
        <HStack gap={2} wrap="wrap" vAlign="center">
          <Tooltip content="Use the theme's own color">
            <Button
              label="Theme"
              size="sm"
              variant={value.accent === null ? 'primary' : 'secondary'}
              onClick={() => set('accent', null)}
            />
          </Tooltip>
          {ACCENT_SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              aria-pressed={value.accent === c}
              style={swatchStyle(c, value.accent === c)}
              onClick={() => set('accent', c)}>
              {value.accent === c && <Icon icon={CheckIcon} size="sm" color="inherit" />}
            </button>
          ))}
          <input
            type="color"
            aria-label="Pick any accent color"
            title="Pick any color"
            style={pickerStyle}
            value={value.accent ?? '#888888'}
            onChange={e => set('accent', e.target.value.toUpperCase())}
          />
        </HStack>
      </Group>

      <Selector
        label="Fonts"
        value={value.fonts}
        onChange={v => set('fonts', v as FontPairId)}
        options={(Object.keys(FONT_PAIRS) as FontPairId[]).map(id => ({
          value: id,
          label: FONT_PAIRS[id].label,
        }))}
      />

      <Group title="Corners">
        <SegmentedControl
          label="Corners"
          layout="fill"
          value={value.roundness === null ? 'theme' : String(value.roundness)}
          onChange={v => set('roundness', ROUNDNESS.find(r => r.value === v)?.n ?? null)}>
          {ROUNDNESS.map(r => (
            <SegmentedControlItem key={r.value} value={r.value} label={r.label} />
          ))}
        </SegmentedControl>
      </Group>

      <Group title="Spacing">
        <SegmentedControl
          label="Spacing"
          layout="fill"
          value={value.spacing}
          onChange={v => set('spacing', v as Spacing)}>
          <SegmentedControlItem value="tight" label="Tight" />
          <SegmentedControlItem value="normal" label="Normal" />
          <SegmentedControlItem value="airy" label="Airy" />
        </SegmentedControl>
      </Group>

      <Group title="Text size">
        <SegmentedControl
          label="Text size"
          layout="fill"
          value={value.textSize ?? 'theme'}
          onChange={v => set('textSize', v === 'theme' ? null : (v as 'smaller' | 'larger'))}>
          <SegmentedControlItem value="smaller" label="Smaller" />
          <SegmentedControlItem value="theme" label="Theme" />
          <SegmentedControlItem value="larger" label="Larger" />
        </SegmentedControl>
      </Group>

      <Group title="Mode">
        <SegmentedControl
          label="Light or dark"
          layout="fill"
          isDisabled={isDarkOnly(value.preset)}
          disabledMessage="Gothic is designed to be dark only"
          value={effectiveMode(value)}
          onChange={v => set('mode', v as 'light' | 'dark')}>
          <SegmentedControlItem value="light" label="Light" icon={<Icon icon={SunIcon} size="sm" />} />
          <SegmentedControlItem value="dark" label="Dark" icon={<Icon icon={MoonIcon} size="sm" />} />
        </SegmentedControl>
      </Group>
    </VStack>
  );
}
