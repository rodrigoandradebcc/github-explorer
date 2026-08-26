import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, GlassView, Heading, useTheme } from '@/design-system';
import { isRateLimitError } from '@/domain/errors/DataAccessError';
import { useSearchRepos } from '@/presentation/repositories/hooks/useSearchRepos';
import { DataSourceToggle } from '@/presentation/shared/components/DataSourceToggle';
import { useDebounce } from '@/presentation/shared/hooks/useDebounce';
import type { Repository } from '@/domain/entities/Repository';

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
  } = useSearchRepos(debouncedQuery);

  const repos = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const hasQuery = debouncedQuery.trim().length > 0;
  const isRateLimit = isRateLimitError(error);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRepoPress = useCallback(
    (repo: Repository) => {
      router.push(
        `/repository/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}`,
      );
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
        <Box
          paddingHorizontal="md"
          paddingTop="sm"
          paddingBottom="sm"
          direction="row"
          align="center"
          justify="space-between"
        >
          <Heading level={2}>Repo Explorer</Heading>
          <DataSourceToggle />
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
