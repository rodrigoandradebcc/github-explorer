import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, GlassView, Heading, useTheme } from '@/design-system';
import { useSearchRepositories } from '@/features/repositories/hooks/useSearchRepositories';
import { useDebounce } from '@/hooks/useDebounce';
import type { Repository } from '@/domain/entities/Repository';
import { ApiError } from '@/application';

import { SearchBottomTabBar } from '../components/SearchBottomTabBar';
import { SearchContent } from '../components/SearchContent';

export function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(inputValue, 500);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSearchRepositories(debouncedQuery);

  const repos = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const hasQuery = debouncedQuery.trim().length > 0;
  const isRateLimit = error instanceof ApiError && error.isRateLimit;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRepoPress = useCallback(
    (repo: Repository) => {
      router.push(`/repository/${repo.owner.login}/${repo.name}`);
    },
    [router],
  );

  const handleDesignPress = useCallback(() => {
    router.push('/showcase');
  }, [router]);

  const searchResult = useMemo(
    () => ({
      repos,
      query: debouncedQuery,
      hasQuery,
      isLoading,
      isError,
      isRateLimit,
      isFetchingNextPage,
      isRefetching,
    }),
    [
      repos,
      debouncedQuery,
      hasQuery,
      isLoading,
      isError,
      isRateLimit,
      isFetchingNextPage,
      isRefetching,
    ],
  );

  const layout = useMemo(() => ({ headerHeight, tabBarHeight }), [headerHeight, tabBarHeight]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <SearchContent
        searchResult={searchResult}
        layout={layout}
        inputValue={inputValue}
        onChangeText={setInputValue}
        onSelectTopic={setInputValue}
        onRetry={refetch}
        onRefresh={refetch}
        onEndReached={handleEndReached}
        onRepoPress={handleRepoPress}
      />

      <GlassView
        style={[styles.header, { paddingTop: insets.top }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Box paddingHorizontal="md" paddingTop="sm" paddingBottom="sm">
          <Heading level={2}>GitHub Explorer</Heading>
        </Box>
      </GlassView>

      <SearchBottomTabBar
        bottomInset={insets.bottom}
        onDesignPress={handleDesignPress}
        onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.20)',
  },
});
