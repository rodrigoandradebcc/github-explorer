const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

const RULES_DOC = 'docs/ARCHITECTURE-RULES.md';

const layer = (name, groups) => ({
  group: groups,
  message: `${name} (${RULES_DOC} §3).`,
});

const INFRA_UI_PATTERNS = [
  '@/presentation',
  '@/presentation/**',
  '@/app/**',
  '@/design-system',
  '@/design-system/**',
];

module.exports = defineConfig([
  ...expoConfig,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },

  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('domain/ não importa nenhuma outra camada', [
              '@/application',
              '@/application/**',
              '@/infrastructure',
              '@/infrastructure/**',
              '@/presentation',
              '@/presentation/**',
              '@/design-system',
              '@/design-system/**',
              '@/app/**',
            ]),
            layer('domain/ tem que rodar em Node puro, sem framework', [
              'react',
              'react-*',
              'react-native',
              'axios',
              '@tanstack/**',
              'expo',
              'expo-*',
              '@react-native-async-storage/**',
            ]),
          ],
        },
      ],
    },
  },

  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('application/ só importa domain/', [
              '@/infrastructure',
              '@/infrastructure/**',
              '@/presentation',
              '@/presentation/**',
              '@/design-system',
              '@/design-system/**',
              '@/app/**',
            ]),
            layer('application/ não conhece UI nem transporte', [
              'react',
              'react-*',
              'react-native',
              'axios',
              '@tanstack/**',
              'expo',
              'expo-*',
              '@react-native-async-storage/**',
            ]),
          ],
        },
      ],
    },
  },

  {
    files: ['src/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('presentation/ recebe infraestrutura injetada por app/_layout.tsx', [
              '@/infrastructure',
              '@/infrastructure/**',
            ]),
            layer('presentation/ nunca chama API nem storage direto', [
              'axios',
              '@react-native-async-storage/**',
            ]),
          ],
        },
      ],
    },
  },

  {
    files: ['src/design-system/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('design-system/ é biblioteca fechada: só a si mesmo e ports de domain/', [
              '@/application',
              '@/application/**',
              '@/infrastructure',
              '@/infrastructure/**',
              '@/presentation',
              '@/presentation/**',
              '@/app/**',
              '@react-native-async-storage/**',
            ]),
          ],
        },
      ],
    },
  },

  {
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('infrastructure/ não conhece UI', INFRA_UI_PATTERNS),
            layer('application/ só entra pela infrastructure/di/container.ts', [
              '@/application',
              '@/application/**',
            ]),
          ],
        },
      ],
    },
  },

  {
    files: ['src/infrastructure/di/container.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [layer('infrastructure/ não conhece UI', INFRA_UI_PATTERNS)],
        },
      ],
    },
  },

  {
    ignores: ['node_modules/', '.expo/', 'dist/'],
  },
]);
