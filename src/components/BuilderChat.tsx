'use client';

import {Fragment, useState, type CSSProperties} from 'react';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Spinner} from '@astryxdesign/core/Spinner';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatToolCalls,
} from '@astryxdesign/core/Chat';
import {
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type {Builder, BuilderTurn} from '@/lib/useBuilder';

const KEY_PAGE = 'https://aistudio.google.com/apikey';

// Things people can tap to get going. Each one is sent as a normal message.
const IDEAS = [
  'Make this a wedding photographer\'s site',
  'Add three short testimonials',
  'Make it dark and calm',
];

// The chat fills whatever room its panel gives it, and scrolls inside itself.
const fillStyle: CSSProperties = {display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0};
const scrollStyle: CSSProperties = {flex: 1, minHeight: 0, overflowY: 'auto'};
// The chat centres its empty state and lets it grow as wide as its longest
// line. This keeps it inside the panel instead.
const emptyStyle: CSSProperties = {width: '100%', minWidth: 0, boxSizing: 'border-box'};

export function BuilderChat({builder}: {builder: Builder}) {
  return builder.hasKey ? <Conversation builder={builder} /> : <KeySetup onSave={builder.saveKey} />;
}

/** First visit: explains the key and takes it. */
function KeySetup({onSave}: {onSave: Builder['saveKey']}) {
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const submit = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setProblem(await onSave(value));
    setIsChecking(false);
  };

  return (
    <div style={scrollStyle}>
      <VStack gap={5} padding={4}>
        <VStack gap={1}>
          <Heading level={3}>Build with AI</Heading>
          <Text color="secondary">
            Say what you want and watch the page change. It runs on Gemini, Google&apos;s AI, which is free with
            your own key.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Text weight="semibold">1. Get a free key</Text>
          <Text type="supporting" color="secondary">
            Sign in with a Google account and press &ldquo;Create API key&rdquo;. It takes about a minute.
          </Text>
          <Button
            label="Open Google AI Studio"
            href={KEY_PAGE}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            endContent={<Icon icon={ArrowTopRightOnSquareIcon} size="sm" />}
          />
        </VStack>

        <VStack gap={2}>
          <Text weight="semibold">2. Paste it here</Text>
          <TextInput
            label="Gemini key"
            isLabelHidden
            type="password"
            placeholder="Paste your key"
            value={value}
            onChange={next => {
              setValue(next);
              setProblem(null);
            }}
            onEnter={submit}
            autoComplete="off"
            hasSpellCheck={false}
            status={problem ? {type: 'error', message: problem} : undefined}
          />
          <Button
            label="Save key"
            variant="primary"
            isLoading={isChecking}
            isDisabled={value.trim() === ''}
            onClick={submit}
          />
        </VStack>

        <Text type="supporting" color="secondary">
          Your key is kept in this browser only and goes straight to Google, nowhere else. On the free plan, Google
          may use what you type to improve its AI, so leave out anything private.
        </Text>
      </VStack>
    </div>
  );
}

function Conversation({builder}: {builder: Builder}) {
  const {turns, isWorking, models, model} = builder;
  const modelLabel = models.find(m => m.id === model)?.label ?? model;

  return (
    <div style={fillStyle}>
      <HStack gap={1} hAlign="between" vAlign="center" padding={2}>
        {models.length > 1 ? (
          <DropdownMenu
            button={{label: modelLabel, variant: 'ghost', size: 'sm'}}
            items={models.map(m => ({
              label: m.label,
              description: m.id === model ? 'In use' : undefined,
              onClick: () => builder.setModel(m.id),
            }))}
            menuWidth={260}
          />
        ) : (
          <Text type="supporting" color="secondary">
            {modelLabel}
          </Text>
        )}
        <DropdownMenu
          button={{
            label: 'Chat options',
            variant: 'ghost',
            size: 'sm',
            isIconOnly: true,
            icon: <Icon icon={EllipsisHorizontalIcon} size="sm" />,
          }}
          items={[
            {label: 'Clear the chat', description: 'Your page stays as it is', onClick: builder.clear},
            {label: 'Remove my key', description: 'Forgets it in this browser', onClick: builder.removeKey},
          ]}
          alignment="end"
          menuWidth={240}
        />
      </HStack>

      <div style={fillStyle}>
        <ChatLayout
          density="compact"
          composer={
            <ChatComposer
              density="compact"
              placeholder="Describe a change"
              onSubmit={builder.send}
              onStop={builder.stop}
              isStopShown={isWorking}
            />
          }
          emptyState={
            <div style={emptyStyle}>
              <VStack gap={3} padding={4}>
                <VStack gap={1}>
                  <Heading level={3}>What should we build?</Heading>
                  <Text color="secondary">
                    Ask for sections, wording or a whole new look. Photos you add yourself in Sections.
                  </Text>
                </VStack>
                <VStack gap={2}>
                  {IDEAS.map(idea => (
                    <Button key={idea} label={idea} variant="secondary" size="sm" onClick={() => builder.send(idea)} />
                  ))}
                </VStack>
              </VStack>
            </div>
          }>
          {turns.length > 0 ? (
            <ChatMessageList density="compact" isStreaming={isWorking}>
              {turns.map(turn => (
                <Fragment key={turn.id}>
                  <ChatMessage sender="user">
                    <ChatMessageBubble>{turn.userText}</ChatMessageBubble>
                  </ChatMessage>
                  <ChatMessage sender="assistant">
                    <Answer turn={turn} />
                  </ChatMessage>
                </Fragment>
              ))}
            </ChatMessageList>
          ) : null}
        </ChatLayout>
      </div>
    </div>
  );
}

/** The AI's side of one exchange: the changes it made, then what it said. */
function Answer({turn}: {turn: BuilderTurn}) {
  return (
    <VStack gap={2}>
      {turn.steps.length > 0 && (
        <ChatToolCalls
          label={turn.steps.length === 1 ? '1 change' : `${turn.steps.length} changes`}
          defaultIsExpanded
          calls={turn.steps.map((step, i) => ({
            key: `${turn.id}-${i}`,
            name: step.label,
            status: step.ok ? 'complete' : 'error',
          }))}
        />
      )}
      {turn.status === 'working' && (
        <HStack gap={2} vAlign="center">
          <Spinner size="sm" label="Working" />
          <Text type="supporting" color="secondary">
            {turn.steps.length === 0 ? 'Thinking' : 'Still building'}
          </Text>
        </HStack>
      )}
      {turn.reply && <ChatMessageBubble variant="ghost">{turn.reply}</ChatMessageBubble>}
      {turn.error && (
        <HStack gap={2} vAlign="start">
          <Icon icon={ExclamationTriangleIcon} size="sm" />
          <Text>{turn.error}</Text>
        </HStack>
      )}
    </VStack>
  );
}
