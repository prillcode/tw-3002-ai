import React from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';

export type HelpContext = 'sector' | 'market' | 'combat' | 'stardock' | 'general';

export interface HelpScreenProps {
  context: HelpContext;
  onBack: () => void;
}

const CONTROLS: Record<HelpContext, Array<{ keys: string; desc: string }>> = {
  sector: [
    { keys: '↑↓', desc: 'Select warp destination' },
    { keys: 'Enter', desc: 'Jump to selected sector' },
    { keys: 'M', desc: 'Open Market (if port exists)' },
    { keys: 'D', desc: 'Enter StarDock (if present)' },
    { keys: 'H', desc: 'Toggle this help screen' },
    { keys: 'Esc', desc: 'Back / Menu' },
    { keys: 'Q', desc: 'Quit game' },
  ],
  market: [
    { keys: '↑↓', desc: 'Select commodity' },
    { keys: 'B', desc: 'Buy mode' },
    { keys: 'S', desc: 'Sell mode' },
    { keys: '↑↓', desc: 'Adjust quantity' },
    { keys: 'Enter', desc: 'Confirm trade' },
    { keys: 'Esc', desc: 'Leave market' },
  ],
  combat: [
    { keys: '↑↓', desc: 'Select action' },
    { keys: 'Enter', desc: 'Confirm action' },
    { keys: 'A', desc: 'Attack' },
    { keys: 'F', desc: 'Attempt to flee' },
    { keys: 'B', desc: 'Offer bribe' },
    { keys: 'Esc', desc: 'Forfeit / Surrender' },
  ],
  stardock: [
    { keys: '↑↓', desc: 'Select upgrade' },
    { keys: 'Enter', desc: 'Purchase upgrade' },
    { keys: 'Esc', desc: 'Leave StarDock' },
  ],
  general: [
    { keys: '↑↓←→', desc: 'Navigate' },
    { keys: 'Enter', desc: 'Select / Confirm' },
    { keys: 'Esc', desc: 'Back / Cancel' },
    { keys: 'Q', desc: 'Quit game' },
    { keys: 'H', desc: 'Help' },
  ],
};

const CONCEPTS = [
  { title: 'TRADING', lines: [
    'Buy low, sell high. Port classes determine prices.',
    'Class 1: Sells Ore cheap, buys Organics/Equipment.',
    'Class 2: Sells Organics cheap, buys Ore/Equipment.',
    'Class 3: Sells Equipment cheap, buys Ore/Organics.',
  ]},
  { title: 'COMBAT', lines: [
    'Turn-based: attack, flee, or bribe.',
    'Shields absorb 50% of damage before hull.',
    'Flee chance: 25-45% base + dodge modifier.',
    'Bribes accepted based on enemy greed.',
  ]},
  { title: 'UPGRADES', lines: [
    'StarDocks sell hull, cargo, weapon upgrades.',
    'Upgrades are permanent for this save.',
    'Hull and shields repair at StarDocks.',
  ]},
];

export const HelpScreen: React.FC<HelpScreenProps> = ({ context, onBack }) => {
  useKeyHandler({
    onEscape: onBack,
    onH: onBack,
  });

  const controls = CONTROLS[context] ?? CONTROLS.general;

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1} flexDirection="column">
        <Text color="cyan" bold>
          TW 3002 AI — HELP
        </Text>
        <Text color="muted" dimColor>
          Press [H] or [Esc] to close
        </Text>

        <Box paddingY={1} />

        {/* Context controls */}
        <Text color="yellow" bold underline>
          CONTROLS
        </Text>
        <Box paddingY={0} />
        {controls.map((c, i) => (
          <Box key={i} flexDirection="row" gap={2}>
            <Box width={10}>
              <Text color="cyan" bold>[{c.keys}]</Text>
            </Box>
            <Text color="white">{c.desc}</Text>
          </Box>
        ))}

        <Box paddingY={1} />

        {/* Game concepts */}
        <Text color="yellow" bold underline>
          CONCEPTS
        </Text>
        <Box paddingY={0} />
        {CONCEPTS.map((section, si) => (
          <Box key={si} flexDirection="column" marginBottom={1}>
            <Text color="magenta" bold>{section.title}</Text>
            {section.lines.map((line, li) => (
              <Text key={li} color="muted" dimColor>
                {'  '}{line}
              </Text>
            ))}
          </Box>
        ))}

        <Box paddingY={0} />
        <Text color="muted" dimColor>
          v0.6.0 · github.com/prillcode/tw-3002-ai
        </Text>
      </Box>
    </Box>
  );
};

export default HelpScreen;
