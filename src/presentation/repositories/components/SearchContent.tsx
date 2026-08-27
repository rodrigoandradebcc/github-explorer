import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, Platform, View } from 'react-native';

import { Box, Input, useTheme } from '@/design-system';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { DataAccessErrorState } from '@/presentation/shared/components/DataAccessErrorState';
import type { Repo } from '@/domain/entities/Repo';

import { RepositoryCard } from './RepositoryCard';
import { SearchEmptyPrompt } from './SearchEmptyPrompt';
import { SearchEmptyResults } from './SearchEmptyResults';
import { SearchSkeletonList } from './SearchSkeletonList';

interface SearchResult {
  repos: Repo[];
  query: string;
  hasQuery: boolean;
  isLoading: boolean;
  isError: boolean;
  isRateLimit: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
}

interface SearchContentProps {
  searchResult: SearchResult;
  layout: { headerHeight: number; tabBarHeight: number };
  inputValue: string;
  onChangeText: (text: string) => void;
  onSelectTopic: (topic: string) => void;
  onRetry: () => void;
  onRefresh: () => void;
  onEndReached: () => void;
  onRepoPress: (repo: Repo) => void;
}

export function SearchContent({
  searchResult: {
    repos,
    query,
    hasQuery,
    isLoading,
    isError,
    isRateLimit,
    isFetchingNextPage,
    isRefetching,
  },
  layout: { headerHeight, tabBarHeight },
  inputValue,
  onChangeText,
  onSelectTopic,
  onRetry,
  onRefresh,
  onEndReached,
  onRepoPress,
}: SearchContentProps) {
  const { colors, spacing } = useTheme();

  // Repository ids are per-source integers and collide across sources, so the seen-set has to
  // reset on a source switch as well as on a new query. `source` is an opaque reset key here.
  const source = useDataSourceScope();
  const animatedIds = useRef(new Set<number>());
  useEffect(() => {
    animatedIds.current.clear();
  }, [query, source]);

  const searchInput = (
    <Box paddingHorizontal="md" paddingTop="sm" paddingBottom="xs">
      <Input
        placeholder="Buscar repositórios…"
        value={inputValue}
        onChangeText={onChangeText}
        autoCapitalize="none"
        keyboardType="web-search"
        returnKeyType="search"
        leftIcon={<Ionicons name="search-outline" size={18} color={colors.muted} />}
        testID="search-input"
      />
    </Box>
  );
  const insetStyle = useMemo(
    () => ({ flex: 1, paddingTop: headerHeight, paddingBottom: tabBarHeight }),
    [headerHeight, tabBarHeight],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Repo; index: number }) => {
      const animate = !animatedIds.current.has(item.id);
      if (animate) animatedIds.current.add(item.id);
      return (
        <Box paddingHorizontal="md" paddingBottom="sm">
          <RepositoryCard
            repo={item}
            onPress={() => onRepoPress(item)}
            testID={`repo-card-${item.id}`}
            index={index}
            animate={animate}
          />
        </Box>
      );
    },
    [onRepoPress],
  );

  const listContentStyle = useMemo(() => ({ paddingTop: headerHeight }), [headerHeight]);

  const listScrollInsets = useMemo(
    () => ({ top: headerHeight, bottom: tabBarHeight }),
    [headerHeight, tabBarHeight],
  );

  // Bottom padding lives in ListFooterComponent, not contentContainerStyle.paddingBottom,
  // because Android ignores paddingBottom when data changes dynamically in FlatList.
  // Math.max guards against tabBarHeight=0 before onLayout fires.
  const listFooter = useMemo(
    () => (
      <>
        {isFetchingNextPage && (
          <Box paddingVertical="md" align="center">
            <ActivityIndicator color={colors.primary} />
          </Box>
        )}
        <View style={{ height: Math.max(tabBarHeight, 60) + spacing.xl }} />
      </>
    ),
    [isFetchingNextPage, colors.primary, tabBarHeight, spacing.xl],
  );

  if (isLoading && hasQuery) {
    return (
      <View style={insetStyle}>
        {searchInput}
        <SearchSkeletonList />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={insetStyle}>
        {searchInput}
        <DataAccessErrorState
          isRateLimit={isRateLimit}
          genericMessage="Não foi possível acessar a fonte de dados. Verifique sua conexão e tente novamente."
          testID={isRateLimit ? 'rate-limit-error' : 'generic-error'}
          onRetry={onRetry}
        />
      </View>
    );
  }

  if (!hasQuery) {
    return (
      <View style={insetStyle}>
        {searchInput}
        <SearchEmptyPrompt onSelectTopic={onSelectTopic} />
      </View>
    );
  }

  if (repos.length === 0) {
    return (
      <View style={insetStyle}>
        {searchInput}
        <SearchEmptyResults query={query} />
      </View>
    );
  }

  return (
    <FlatList
      data={repos}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={isRefetching}
      ListHeaderComponent={searchInput}
      ListFooterComponent={listFooter}
      contentContainerStyle={listContentStyle}
      scrollIndicatorInsets={listScrollInsets}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      testID="repos-list"
    />
  );
}
