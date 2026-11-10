'use client';

import {useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Layout';
import {Text, Heading} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {List, ListItem} from '@astryxdesign/core/List';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Divider} from '@astryxdesign/core/Divider';
import {Icon} from '@astryxdesign/core/Icon';
import {DropdownMenu, type DropdownMenuOption} from '@astryxdesign/core/DropdownMenu';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  IdentificationIcon,
  Squares2X2Icon,
  BriefcaseIcon,
  EnvelopeIcon,
  Bars2Icon,
} from '@heroicons/react/24/outline';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {
  SECTION_META,
  createSection,
  newId,
  newJob,
  newLink,
  newProject,
  newQuote,
  newShot,
  newStat,
  type ImageRef,
  type PortfolioSection,
  type SectionType,
} from '@/lib/portfolio';
import {saveImage, useImageSrc} from '@/lib/imageStore';

export const SECTION_ICONS: Record<SectionType, typeof EyeIcon> = {
  hero: UserCircleIcon,
  about: IdentificationIcon,
  projects: Squares2X2Icon,
  experience: BriefcaseIcon,
  testimonials: ChatBubbleLeftRightIcon,
  stats: ChartBarIcon,
  text: DocumentTextIcon,
  contact: EnvelopeIcon,
  gallery: PhotoIcon,
};

/** `mergeKey` tells undo to group rapid typing into one step. */
export type SectionsChange = (next: PortfolioSection[], mergeKey?: string) => void;

// ---------------------------------------------------------------------------
// Repeating items (projects, roles, quotes, stats, links)
// ---------------------------------------------------------------------------

function ItemList<T extends {id: string}>({
  items,
  noun,
  onChange,
  create,
  title,
  renderFields,
}: {
  items: T[];
  noun: string;
  onChange: (next: T[], mergeKey?: string) => void;
  create: () => T;
  title: (item: T) => string;
  renderFields: (item: T, update: (patch: Partial<T>, field: string) => void) => ReactNode;
}) {
  const update = (id: string, patch: Partial<T>, field: string) =>
    onChange(
      items.map(it => (it.id === id ? {...it, ...patch} : it)),
      `${id}.${field}`,
    );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    onChange(arrayMove(items, i, j));
  };

  return (
    <VStack gap={3}>
      {items.map((item, i) => (
        <Card key={item.id} padding={3} variant="muted" elevation="none">
          <VStack gap={3}>
            <HStack gap={1} hAlign="between" vAlign="center">
              <Text type="label" weight="semibold" maxLines={1}>
                {title(item) || `${noun} ${i + 1}`}
              </Text>
              <HStack gap={0.5}>
                <Button
                  label={`Move ${noun.toLowerCase()} up`}
                  icon={<Icon icon={ArrowUpIcon} size="sm" />}
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  isDisabled={i === 0}
                  onClick={() => move(i, -1)}
                />
                <Button
                  label={`Move ${noun.toLowerCase()} down`}
                  icon={<Icon icon={ArrowDownIcon} size="sm" />}
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  isDisabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                />
                <Button
                  label={`Remove ${noun.toLowerCase()}`}
                  icon={<Icon icon={TrashIcon} size="sm" />}
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onClick={() => onChange(items.filter(it => it.id !== item.id))}
                />
              </HStack>
            </HStack>
            {renderFields(item, (patch, field) => update(item.id, patch, field))}
          </VStack>
        </Card>
      ))}
      <Button
        label={`Add ${noun.toLowerCase()}`}
        variant="secondary"
        icon={<Icon icon={PlusIcon} size="sm" />}
        onClick={() => onChange([...items, create()])}
      />
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Photo picker
// ---------------------------------------------------------------------------

const thumbStyle: CSSProperties = {
  width: 64,
  height: 64,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: 'var(--radius-element)',
  backgroundColor: 'var(--color-background-muted)',
};
const thumbImgStyle: CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', display: 'block'};

/** Pick a photo from this device. It is saved in this browser, not uploaded anywhere. */
function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ImageRef;
  onChange: (next: ImageRef) => void;
}) {
  const src = useImageSrc(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setIsBusy(true);
    setError(null);
    try {
      onChange(await saveImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That picture could not be added.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <VStack gap={2}>
      <Text type="label" weight="semibold">
        {label}
      </Text>
      <HStack gap={3} vAlign="center">
        <div style={thumbStyle}>
          {src ? (
            // A plain <img>: uploads are local blob URLs, which next/image cannot optimise.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" style={thumbImgStyle} />
          ) : (
            <Icon icon={PhotoIcon} color="secondary" />
          )}
        </div>
        <HStack gap={1} wrap="wrap">
          <Button
            label={value ? 'Change photo' : 'Add photo'}
            variant="secondary"
            size="sm"
            isLoading={isBusy}
            onClick={() => inputRef.current?.click()}
          />
          {value && <Button label="Remove" variant="ghost" size="sm" onClick={() => onChange('')} />}
        </HStack>
      </HStack>
      {error && (
        <Text type="supporting" color="secondary" role="alert">
          {error}
        </Text>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        aria-label={label}
        onChange={e => {
          void pick(e.target.files?.[0]);
          // Clear it so picking the same file twice still fires.
          e.target.value = '';
        }}
      />
    </VStack>
  );
}

const splitList = (v: string) =>
  v
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Per-section form
// ---------------------------------------------------------------------------

function SectionForm({
  section: s,
  onPatch,
}: {
  section: PortfolioSection;
  onPatch: (patch: Record<string, unknown>, field?: string) => void;
}) {
  // A text field: every keystroke is one merged undo step per field.
  const field = (label: string, key: string, value: string, opts: {multiline?: boolean; description?: string} = {}) =>
    opts.multiline ? (
      <TextArea label={label} value={value} onChange={v => onPatch({[key]: v}, key)} />
    ) : (
      <TextInput
        label={label}
        description={opts.description}
        value={value}
        onChange={v => onPatch({[key]: v}, key)}
      />
    );

  const layoutPicker = (
    <VStack gap={2}>
      <Text type="label" weight="semibold">
        Layout
      </Text>
      <SegmentedControl
        label="Layout"
        layout="fill"
        value={s.layout}
        onChange={v => onPatch({layout: v})}>
        {SECTION_META[s.type].layouts.map(l => (
          <SegmentedControlItem key={l.value} value={l.value} label={l.label} />
        ))}
      </SegmentedControl>
    </VStack>
  );

  const items = (k: string) => (next: unknown[], mergeKey?: string) =>
    onPatch({[k]: next}, mergeKey ? `${k}.${mergeKey}` : undefined);

  switch (s.type) {
    case 'hero':
      return (
        <VStack gap={3}>
          {layoutPicker}
          <ImageField label="Your photo" value={s.photo} onChange={v => onPatch({photo: v})} />
          {field('Your name', 'name', s.name)}
          {field('Headline', 'headline', s.headline)}
          {field('Intro', 'intro', s.intro, {multiline: true})}
          {field('Main button', 'primaryLabel', s.primaryLabel, {description: 'Leave empty to hide'})}
          {field('Second button', 'secondaryLabel', s.secondaryLabel, {description: 'Leave empty to hide'})}
        </VStack>
      );
    case 'about':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          <ImageField label="Photo" value={s.photo} onChange={v => onPatch({photo: v})} />
          {field('About you', 'body', s.body, {multiline: true})}
          <TextInput
            label="Skills"
            description="Separate with commas"
            value={s.skills.join(', ')}
            onChange={v => onPatch({skills: splitList(v)}, 'skills')}
          />
        </VStack>
      );
    case 'text':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          {field('Text', 'body', s.body, {multiline: true})}
        </VStack>
      );
    case 'projects':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          <ItemList
            items={s.items}
            noun="Project"
            onChange={items('items')}
            create={newProject}
            title={p => p.title}
            renderFields={(p, set) => (
              <>
                <ImageField label="Cover picture" value={p.image} onChange={v => set({image: v}, 'image')} />
                <TextInput label="Title" value={p.title} onChange={v => set({title: v}, 'title')} />
                <TextArea
                  label="Description"
                  value={p.description}
                  onChange={v => set({description: v}, 'description')}
                />
                <TextInput
                  label="Tags"
                  description="Separate with commas"
                  value={p.tags.join(', ')}
                  onChange={v => set({tags: splitList(v)}, 'tags')}
                />
                <TextInput
                  label="Link"
                  placeholder="https://"
                  value={p.url}
                  onChange={v => set({url: v}, 'url')}
                />
              </>
            )}
          />
        </VStack>
      );
    case 'experience':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          <ItemList
            items={s.items}
            noun="Role"
            onChange={items('items')}
            create={newJob}
            title={j => j.role}
            renderFields={(j, set) => (
              <>
                <TextInput label="Role" value={j.role} onChange={v => set({role: v}, 'role')} />
                <TextInput label="Company" value={j.company} onChange={v => set({company: v}, 'company')} />
                <TextInput label="When" value={j.period} onChange={v => set({period: v}, 'period')} />
                <TextArea label="What you did" value={j.summary} onChange={v => set({summary: v}, 'summary')} />
              </>
            )}
          />
        </VStack>
      );
    case 'testimonials':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          <ItemList
            items={s.items}
            noun="Quote"
            onChange={items('items')}
            create={newQuote}
            title={q => q.author}
            renderFields={(q, set) => (
              <>
                <TextArea label="Quote" value={q.quote} onChange={v => set({quote: v}, 'quote')} />
                <TextInput label="Who said it" value={q.author} onChange={v => set({author: v}, 'author')} />
                <TextInput label="Their role" value={q.role} onChange={v => set({role: v}, 'role')} />
                <ImageField label="Their photo" value={q.avatar} onChange={v => set({avatar: v}, 'avatar')} />
              </>
            )}
          />
        </VStack>
      );
    case 'stats':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading, {description: 'Leave empty to hide'})}
          <ItemList
            items={s.items}
            noun="Stat"
            onChange={items('items')}
            create={newStat}
            title={st => st.value}
            renderFields={(st, set) => (
              <>
                <TextInput label="Number" value={st.value} onChange={v => set({value: v}, 'value')} />
                <TextInput label="What it means" value={st.label} onChange={v => set({label: v}, 'label')} />
              </>
            )}
          />
        </VStack>
      );
    case 'gallery':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading, {description: 'Leave empty to hide'})}
          <ItemList
            items={s.items}
            noun="Picture"
            onChange={items('items')}
            create={newShot}
            title={g => g.caption}
            renderFields={(g, set) => (
              <>
                <ImageField label="Picture" value={g.image} onChange={v => set({image: v}, 'image')} />
                <TextInput label="Caption" value={g.caption} onChange={v => set({caption: v}, 'caption')} />
              </>
            )}
          />
        </VStack>
      );
    case 'contact':
      return (
        <VStack gap={3}>
          {layoutPicker}
          {field('Heading', 'heading', s.heading)}
          {field('Message', 'body', s.body, {multiline: true})}
          {field('Email', 'email', s.email)}
          <ItemList
            items={s.links}
            noun="Link"
            onChange={items('links')}
            create={newLink}
            title={l => l.label}
            renderFields={(l, set) => (
              <>
                <TextInput label="Label" value={l.label} onChange={v => set({label: v}, 'label')} />
                <TextInput label="URL" value={l.url} onChange={v => set({url: v}, 'url')} />
              </>
            )}
          />
        </VStack>
      );
  }
}

// ---------------------------------------------------------------------------
// Sortable section row
// ---------------------------------------------------------------------------

const handleStyle: CSSProperties = {
  cursor: 'grab',
  display: 'grid',
  placeItems: 'center',
  touchAction: 'none',
  color: 'var(--color-text-secondary)',
};

function SortableRow({
  section: s,
  index,
  count,
  isSelected,
  onSelect,
  onToggleHidden,
  onMove,
  onDuplicate,
  onDelete,
}: {
  section: PortfolioSection;
  index: number;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} =
    useSortable({id: s.id});
  const rowStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };

  const menu: DropdownMenuOption[] = [
    {label: 'Duplicate', icon: DocumentDuplicateIcon, onClick: onDuplicate},
    {label: 'Move up', icon: ArrowUpIcon, onClick: () => onMove(-1), isDisabled: index === 0},
    {label: 'Move down', icon: ArrowDownIcon, onClick: () => onMove(1), isDisabled: index === count - 1},
    {type: 'divider'},
    {label: 'Delete section', icon: TrashIcon, variant: 'destructive', onClick: onDelete},
  ];

  return (
    <div ref={setNodeRef} style={rowStyle}>
      <ListItem
        label={SECTION_META[s.type].label}
        description={s.isHidden ? 'Hidden' : undefined}
        isSelected={isSelected}
        onClick={onSelect}
        startContent={
          <HStack gap={1} vAlign="center">
            <span
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Drag to reorder ${SECTION_META[s.type].label}`}
              style={handleStyle}
              onClick={e => e.stopPropagation()}>
              <Icon icon={Bars2Icon} size="sm" color="secondary" />
            </span>
            <Icon icon={SECTION_ICONS[s.type]} color="secondary" />
          </HStack>
        }
        endContent={
          <HStack gap={0.5} vAlign="center">
            <Button
              label={s.isHidden ? 'Show section' : 'Hide section'}
              icon={<Icon icon={s.isHidden ? EyeSlashIcon : EyeIcon} size="sm" />}
              variant="ghost"
              size="sm"
              isIconOnly
              onClick={e => {
                e.stopPropagation();
                onToggleHidden();
              }}
            />
            <DropdownMenu
              button={{
                label: 'More actions',
                icon: <Icon icon={EllipsisHorizontalIcon} size="sm" />,
                variant: 'ghost',
                size: 'sm',
                isIconOnly: true,
              }}
              items={menu}
              alignment="end"
            />
          </HStack>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function SectionsPanel({
  sections,
  selectedId,
  onSelect,
  onChange,
}: {
  sections: PortfolioSection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: SectionsChange;
}) {
  const selected = sections.find(s => s.id === selectedId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  const move = (id: string, dir: -1 | 1) => {
    const i = sections.findIndex(s => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sections.length) return;
    onChange(arrayMove(sections, i, j));
  };
  const patch = (id: string, change: Record<string, unknown>, field?: string) =>
    onChange(
      sections.map(s => (s.id === id ? ({...s, ...change} as PortfolioSection) : s)),
      field ? `${id}.${field}` : undefined,
    );
  const add = (type: SectionType) => {
    const fresh = createSection(type);
    // New sections go just after the selected one, or at the end.
    const at = selected ? sections.indexOf(selected) + 1 : sections.length;
    onChange([...sections.slice(0, at), fresh, ...sections.slice(at)]);
    onSelect(fresh.id);
  };
  const duplicate = (s: PortfolioSection) => {
    const copy = structuredClone(s) as PortfolioSection;
    copy.id = newId(s.type);
    if ('items' in copy) copy.items = copy.items.map(it => ({...it, id: newId('i')})) as typeof copy.items;
    const at = sections.indexOf(s) + 1;
    onChange([...sections.slice(0, at), copy, ...sections.slice(at)]);
    onSelect(copy.id);
  };
  const remove = (id: string) => {
    onChange(sections.filter(s => s.id !== id));
    if (selectedId === id) onSelect(null);
  };
  const onDragEnd = ({active, over}: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex(s => s.id === active.id);
    const to = sections.findIndex(s => s.id === over.id);
    onChange(arrayMove(sections, from, to));
  };

  const addMenu: DropdownMenuOption[] = (Object.keys(SECTION_META) as SectionType[]).map(type => ({
    label: SECTION_META[type].label,
    description: SECTION_META[type].description,
    icon: SECTION_ICONS[type],
    onClick: () => add(type),
  }));

  if (selected) {
    return (
      <VStack gap={4}>
        <HStack gap={2} vAlign="center">
          <Button
            label="Back to sections"
            icon={<Icon icon={ChevronLeftIcon} size="sm" />}
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={() => onSelect(null)}
          />
          <Heading level={3}>{SECTION_META[selected.type].label}</Heading>
        </HStack>
        <SectionForm section={selected} onPatch={(change, f) => patch(selected.id, change, f)} />
        <Divider />
        <Button
          label="Delete section"
          variant="destructive"
          icon={<Icon icon={TrashIcon} size="sm" />}
          onClick={() => remove(selected.id)}
        />
      </VStack>
    );
  }

  return (
    <VStack gap={4}>
      <HStack gap={2} hAlign="between" vAlign="center">
        <VStack gap={0.5}>
          <Heading level={3}>Sections</Heading>
          <Text type="supporting" color="secondary">
            Drag to reorder. Click to edit.
          </Text>
        </VStack>
        <DropdownMenu
          button={{label: 'Add', icon: <Icon icon={PlusIcon} size="sm" />, variant: 'primary', size: 'sm'}}
          items={addMenu}
          alignment="end"
          menuWidth={300}
        />
      </HStack>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <List density="balanced" hasDividers={false}>
            {sections.map((s, i) => (
                <SortableRow
                  key={s.id}
                  section={s}
                  index={i}
                  count={sections.length}
                  isSelected={false}
                  onSelect={() => onSelect(s.id)}
                  onToggleHidden={() => patch(s.id, {isHidden: !s.isHidden})}
                  onMove={dir => move(s.id, dir)}
                  onDuplicate={() => duplicate(s)}
                  onDelete={() => remove(s.id)}
                />
              ))}
          </List>
        </SortableContext>
      </DndContext>
    </VStack>
  );
}
