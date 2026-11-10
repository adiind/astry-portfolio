'use client';

import {useCallback, useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {
  HStack,
  VStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutPanel,
} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {BottomSheet} from '@astryxdesign/core/BottomSheet';
import {DropdownMenu, type DropdownMenuOption} from '@astryxdesign/core/DropdownMenu';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useHotkeys, useMediaQuery} from '@astryxdesign/core/hooks';
import {Theme} from '@astryxdesign/core/theme';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  HomeIcon,
  PaintBrushIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import {BuilderChat} from '@/components/BuilderChat';
import {PortfolioView} from '@/components/PortfolioView';
import {SectionsPanel, type SectionsChange} from '@/components/SectionsPanel';
import {ThemePanel} from '@/components/ThemePanel';
import {replayCalls} from '@/lib/builderTools';
import {upgradeSection, type Portfolio} from '@/lib/portfolio';
import {SAMPLES, SAMPLE_PORTFOLIO, getSample} from '@/lib/samples';
import {buildTheme, effectiveMode, type ThemeSettings} from '@/lib/themes';
import {useBuilder} from '@/lib/useBuilder';
import {useHistory} from '@/lib/useHistory';
import {BRAND} from '@/lib/brand';

type Viewport = 'desktop' | 'tablet' | 'phone';
type SheetTab = 'ai' | 'sections' | 'theme';
/** The two tabs of the left panel on wide screens. */
type SideTab = 'ai' | 'sections';
const VIEWPORT_WIDTH: Record<Viewport, number> = {desktop: 1040, tablet: 768, phone: 390};
const STORAGE_KEY = 'astry-portfolio:draft:v1';

const pageStyle: CSSProperties = {height: '100dvh'};
const stickyTabsStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: 'var(--color-background-surface)',
};
// The left panel: tabs on top, and the chosen tab fills the rest.
const sideColumnStyle: CSSProperties = {display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0};
const sideScrollStyle: CSSProperties = {flex: 1, minHeight: 0, overflowY: 'auto'};
// In the bottom sheet the chat needs a fixed height, so its box for typing
// stays at the bottom. The sheet is 55dvh tall; the tab row above takes 37px.
const sheetChatStyle: CSSProperties = {display: 'flex', flexDirection: 'column', height: 'calc(55dvh - 38px)'};

// Restores the last draft from this browser (phase 3 moves this to the database).
function loadDraft(): Portfolio {
  try {
    // /studio?sample=engineer opens that finished example (the home page links here).
    const asked = getSample(new URLSearchParams(window.location.search).get('sample'));
    if (asked) return asked.portfolio;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_PORTFOLIO;
    const draft = JSON.parse(raw) as Partial<Portfolio>;
    return {
      sections: (draft.sections ?? SAMPLE_PORTFOLIO.sections).map(upgradeSection),
      theme: {...SAMPLE_PORTFOLIO.theme, ...draft.theme},
    };
  } catch {
    return SAMPLE_PORTFOLIO;
  }
}

// Runs only in the browser (see app/page.tsx), so the draft loads before the first paint.
export function Editor() {
  const history = useHistory<Portfolio>(loadDraft);
  const portfolio = history.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [sheetTab, setSheetTab] = useState<SheetTab>('sections');
  const [sideTab, setSideTab] = useState<SideTab>('ai');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Below this width the side panels move into a bottom sheet.
  const isNarrow = useMediaQuery('(max-width: 900px)');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch {
      // Storage can be blocked (private window). The editor still works.
    }
  }, [portfolio]);

  // A selected section that was deleted (or undone away) is no longer selected.
  const activeId = portfolio.sections.some(s => s.id === selectedId) ? selectedId : null;

  // Keep the section being edited in view in the preview.
  useEffect(() => {
    if (!activeId) return;
    document
      .querySelector(`[data-section-id="${CSS.escape(activeId)}"]`)
      ?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }, [activeId]);

  const {set: setHistory, undo, redo} = history;
  const setSections: SectionsChange = useCallback(
    (sections, mergeKey) => setHistory(p => ({...p, sections}), mergeKey),
    [setHistory],
  );
  const setTheme = useCallback(
    (theme: ThemeSettings) => setHistory(p => ({...p, theme})),
    [setHistory],
  );

  // The AI chat reads the page as it is when a message is sent, and saves all
  // of that message's changes as a single undo step.
  const latest = useRef(portfolio);
  useEffect(() => {
    latest.current = portfolio;
  }, [portfolio]);
  const getPortfolio = useCallback(() => latest.current, []);
  const commitBuild = useCallback(
    (update: (current: Portfolio) => Portfolio) => setHistory(update),
    [setHistory],
  );
  const builder = useBuilder({getPortfolio, commit: commitBuild});

  // While the AI is still working, the preview shows its changes so far, so
  // the page builds up in front of you. Hand edits made meanwhile are kept:
  // the AI's changes are redone on top of them.
  const {pending} = builder;
  const shown = useMemo(() => {
    if (!pending) return portfolio;
    return portfolio === pending.base ? pending.working : replayCalls(portfolio, pending.applied);
  }, [portfolio, pending]);

  // Order matters: the first match wins, and "mod+z" also matches with Shift held.
  useHotkeys([
    {keys: 'mod+shift+z', onPress: redo},
    {keys: 'mod+z', onPress: undo},
    {keys: 'mod+y', onPress: redo},
    {keys: 'escape', onPress: () => setSelectedId(null)},
  ]);

  const userTheme = useMemo(() => buildTheme(shown.theme), [shown.theme]);

  const selectFromPreview = (id: string) => {
    setSelectedId(id);
    setSideTab('sections');
    if (isNarrow) {
      setSheetTab('sections');
      setIsSheetOpen(true);
    }
  };
  const openSheet = (tab: SheetTab) => {
    setSheetTab(tab);
    setIsSheetOpen(true);
  };

  const sectionsPanel = (
    <SectionsPanel
      sections={portfolio.sections}
      selectedId={activeId}
      onSelect={setSelectedId}
      onChange={setSections}
    />
  );
  const themePanel = <ThemePanel value={portfolio.theme} onChange={setTheme} />;
  const builderChat = <BuilderChat builder={builder} />;

  // Swapping in an example is itself undoable.
  const startMenu: DropdownMenuOption[] = SAMPLES.map(sample => ({
    label: sample.label,
    description: `${sample.person}'s finished portfolio`,
    onClick: () => {
      history.set(sample.portfolio);
      setSelectedId(null);
    },
  }));

  const undoRedo = (
    <HStack gap={1}>
      <Button
        label="Undo"
        tooltip="Undo (⌘Z)"
        icon={<Icon icon={ArrowUturnLeftIcon} size="sm" />}
        variant="ghost"
        isIconOnly
        isDisabled={!history.canUndo}
        onClick={undo}
      />
      <Button
        label="Redo"
        tooltip="Redo (⇧⌘Z)"
        icon={<Icon icon={ArrowUturnRightIcon} size="sm" />}
        variant="ghost"
        isIconOnly
        isDisabled={!history.canRedo}
        onClick={redo}
      />
    </HStack>
  );

  const header = (
    <LayoutHeader hasDivider>
      <HStack gap={3} hAlign="between" vAlign="center">
        <HStack gap={3} vAlign="center">
          <Button label={`${BRAND} home`} href="/" variant="ghost" size="sm" isIconOnly icon={<Icon icon={HomeIcon} size="sm" />} />
          <Heading level={2}>{BRAND} studio</Heading>
          {!isNarrow && (
            <Text type="supporting" color="secondary">
              Saved in this browser
            </Text>
          )}
        </HStack>
        {!isNarrow && (
          <SegmentedControl label="Preview size" value={viewport} onChange={v => setViewport(v as Viewport)}>
            <SegmentedControlItem
              value="desktop"
              label="Desktop"
              icon={<Icon icon={ComputerDesktopIcon} size="sm" />}
              isLabelHidden
            />
            <SegmentedControlItem
              value="tablet"
              label="Tablet"
              icon={<Icon icon={DeviceTabletIcon} size="sm" />}
              isLabelHidden
            />
            <SegmentedControlItem
              value="phone"
              label="Phone"
              icon={<Icon icon={DevicePhoneMobileIcon} size="sm" />}
              isLabelHidden
            />
          </SegmentedControl>
        )}
        <HStack gap={1} vAlign="center">
          {undoRedo}
          {!isNarrow && (
            <DropdownMenu
              button={{label: 'Start from', variant: 'ghost', icon: <Icon icon={ArrowPathIcon} size="sm" />}}
              items={startMenu}
              alignment="end"
              menuWidth={280}
            />
          )}
        </HStack>
      </HStack>
    </LayoutHeader>
  );

  const preview = (
    <Theme theme={userTheme} mode={effectiveMode(shown.theme)}>
      <PortfolioView
        sections={shown.sections}
        selectedId={activeId}
        onSelectSection={selectFromPreview}
      />
    </Theme>
  );

  // Phones and narrow windows: full-width preview, panels in a bottom sheet.
  if (isNarrow) {
    return (
      <>
        <Layout
          style={pageStyle}
          height="fill"
          header={header}
          content={
            <LayoutContent padding={0} isScrollable label="Preview">
              {preview}
            </LayoutContent>
          }
          footer={
            <LayoutHeader hasDivider>
              <HStack gap={2} hAlign="center">
                <Button
                  label="AI"
                  variant="secondary"
                  icon={<Icon icon={ChatBubbleLeftRightIcon} size="sm" />}
                  onClick={() => openSheet('ai')}
                />
                <Button
                  label="Sections"
                  variant="secondary"
                  icon={<Icon icon={QueueListIcon} size="sm" />}
                  onClick={() => openSheet('sections')}
                />
                <Button
                  label="Theme"
                  variant="secondary"
                  icon={<Icon icon={PaintBrushIcon} size="sm" />}
                  onClick={() => openSheet('theme')}
                />
              </HStack>
            </LayoutHeader>
          }
        />
        <BottomSheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          label="Edit portfolio"
          // About half height, so edits show live in the preview above.
          height="55dvh"
          hasScrim={false}
          padding={0}>
          <VStack gap={0}>
            {/* Tabs stay pinned while the sheet's content scrolls. */}
            <VStack style={stickyTabsStyle}>
              <TabList layout="fill" value={sheetTab} onChange={v => setSheetTab(v as SheetTab)} hasDivider>
                <Tab value="ai" label="AI" />
                <Tab value="sections" label="Sections" />
                <Tab value="theme" label="Theme" />
              </TabList>
            </VStack>
            {sheetTab === 'ai' ? (
              <div style={sheetChatStyle}>{builderChat}</div>
            ) : (
              <VStack padding={4}>{sheetTab === 'sections' ? sectionsPanel : themePanel}</VStack>
            )}
          </VStack>
        </BottomSheet>
      </>
    );
  }

  return (
    <Layout
      style={pageStyle}
      height="fill"
      header={header}
      start={
        <LayoutPanel hasDivider width={340} padding={0} label="Build">
          <div style={sideColumnStyle}>
            <TabList layout="fill" value={sideTab} onChange={v => setSideTab(v as SideTab)} hasDivider>
              <Tab value="ai" label="Build with AI" />
              <Tab value="sections" label="Sections" />
            </TabList>
            {sideTab === 'ai' ? (
              builderChat
            ) : (
              <div style={sideScrollStyle}>
                <VStack padding={4}>{sectionsPanel}</VStack>
              </div>
            )}
          </div>
        </LayoutPanel>
      }
      end={
        <LayoutPanel hasDivider width={320} padding={4} isScrollable label="Theme">
          {themePanel}
        </LayoutPanel>
      }
      content={
        <LayoutContent padding={6} isScrollable label="Preview">
          <VStack gap={2} hAlign="center">
            <Text type="supporting" color="secondary" justify="center">
              Click any section to edit it
            </Text>
            {/* The preview frame narrows to the chosen device width. */}
            <Card padding={0} elevation="med" width="100%" maxWidth={VIEWPORT_WIDTH[viewport]}>
              {preview}
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
