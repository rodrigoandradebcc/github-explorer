import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Badge, Box, Text, useTheme } from '@/design-system';

const SUGGESTED_TOPICS = ['react-native', 'typescript', 'expo', 'next.js', 'tailwindcss', 'python'];

interface SearchEmptyPromptProps {
  onSelectTopic: (topic: string) => void;
}

export function SearchEmptyPrompt({ onSelectTopic }: SearchEmptyPromptProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <Box flex={1} testID="empty-prompt">
      <Box flex={1} align="center" justify="center" padding="xl">
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
          <Ionicons name="search-outline" size={52} color={colors.border} />
        </Animated.View>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(300)}>
          <Box paddingTop="md">
            <Text tone="muted" size="lg" weight="medium">
              Buscar repositórios
            </Text>
          </Box>
          <Box paddingTop="xs">
            <Text tone="muted" size="sm">
              Digite um nome ou tópico para começar
            </Text>
          </Box>
        </Animated.View>
      </Box>

      <Box paddingHorizontal="xl" paddingBottom="xl">
        <Text variant="label" size="xs" tone="muted">
          SUGESTÕES
        </Text>
        <Box paddingTop="sm">
          <Box direction="row" wrap gap="sm">
            {SUGGESTED_TOPICS.map((topic, i) => (
              <Animated.View
                key={topic}
                entering={reducedMotion ? undefined : FadeInDown.delay(200 + i * 50).duration(300)}
              >
                <Pressable onPress={() => onSelectTopic(topic)}>
                  <Badge tone="info" size="sm">
                    {topic}
                  </Badge>
                </Pressable>
              </Animated.View>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
