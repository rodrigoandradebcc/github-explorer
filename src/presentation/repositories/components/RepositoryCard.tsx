import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Avatar, Badge, Box, Card, Heading, Text, useTheme } from '@/design-system';
import type { Repository } from '@/domain/entities/Repository';
import { formatCount } from '@/presentation/shared/formatCount';

interface RepositoryCardProps {
  repo: Repository;
  onPress: () => void;
  testID?: string;
  index?: number;
  animate?: boolean;
}

const PRESS_SPRING = { stiffness: 400, damping: 30 };
const STAGGER_MS = 50;
const MAX_STAGGER_INDEX = 5;
const ENTER_DURATION_MS = 300;
const ENTER_OFFSET_Y = 16;

export function RepositoryCard({
  repo,
  onPress,
  testID,
  index = 0,
  animate = true,
}: RepositoryCardProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const shouldAnimate = animate && !reducedMotion;
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const translateY = useSharedValue(shouldAnimate ? ENTER_OFFSET_Y : 0);

  useEffect(() => {
    if (!shouldAnimate) return;
    const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;
    const id = setTimeout(() => {
      opacity.value = withTiming(1, { duration: ENTER_DURATION_MS });
      translateY.value = withTiming(0, { duration: ENTER_DURATION_MS });
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, PRESS_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  const label = `Repositório ${repo.owner.login}/${repo.name}${repo.description ? `: ${repo.description}` : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
    >
      <Animated.View style={animatedStyle}>
        <Card padding="lg">
          <Box direction="column" gap="xs">
            <Box direction="row" align="center" justify="space-between">
              <Box direction="row" align="center" gap="xs">
                <Avatar
                  uri={repo.owner.avatarUrl ?? undefined}
                  fallback={repo.owner.login}
                  size="sm"
                />
                <Text variant="label" size="xs" tone="muted">
                  {repo.owner.login}
                </Text>
              </Box>
              <Box direction="row" align="center" gap="xs">
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text size="sm" weight="medium">
                  {formatCount(repo.starsCount)}
                </Text>
              </Box>
            </Box>

            <Heading level={3}>{repo.name}</Heading>

            {repo.description !== null && (
              <Text tone="muted" size="sm" numberOfLines={2}>
                {repo.description}
              </Text>
            )}

            {repo.language !== null && (
              <Box direction="row">
                <Badge tone="info" size="sm">
                  {repo.language}
                </Badge>
              </Box>
            )}
          </Box>
        </Card>
      </Animated.View>
    </Pressable>
  );
}
