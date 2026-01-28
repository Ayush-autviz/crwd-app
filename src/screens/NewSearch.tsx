import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Search as SearchIcon, Heart, Plus } from 'lucide-react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCausesBySearch, getCollectives } from '../services/api/crwd';
import { getPosts, newSearch } from '../services/api/social';
import { useAuthStore } from '../store/store';
import SearchResultsHeader from '../components/newsearch/SearchResultsHeader';
import SearchTabs from '../components/newsearch/SearchTabs';
import CauseResultCard from '../components/newsearch/CauseResultCard';
import CollectiveResultCard from '../components/newsearch/CollectiveResultCard';
import UserResultCard from '../components/newsearch/UserResultCard';
import PostResultCard from '../components/newsearch/PostResultCard';
import RequestNonprofitModal from '../components/newsearch/RequestNonprofitModal';

type TabType = 'Causes' | 'Collectives' | 'Users' | 'Posts';

// Map tab names to API tab values
const getTabValue = (tab: TabType): 'cause' | 'collective' | 'user' | 'post' => {
  switch (tab) {
    case 'Causes':
      return 'cause';
    case 'Collectives':
      return 'collective';
    case 'Users':
      return 'user';
    case 'Posts':
      return 'post';
    default:
      return 'cause';
  }
};

export default function NewSearchPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Causes');
  const [hasSearched, setHasSearched] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Get category ID from route params
  const params = route.params as any;
  const categoryId = params?.categoryId;

  // Initialize search query and category from route params if available
  useEffect(() => {
    if (params?.searchQuery) {
      setSearchQuery(params.searchQuery);
      setHasSearched(true);
    }
    // Handle category filtering
    if (params?.categoryId || params?.categoryName) {
      const categoryName = params.categoryName || params.searchQuery;
      setSearchQuery(categoryName);
      setActiveTab('Causes'); // Set to Causes tab for category search
      setHasSearched(true);
    }
  }, [params]);

  // Fetch search results using useInfiniteQuery for pagination
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: categoryId
      ? ['causes-by-category', categoryId, searchQuery, activeTab]
      : ['new-search', activeTab, searchQuery],
    queryFn: ({ pageParam = 1 }) => {
      if (categoryId && activeTab === 'Causes') {
        // Use getCausesBySearch for category filtering
        // When searching by category, if search query matches category name, pass empty string to get all causes in that category
        const categoryName = params?.categoryName;
        const searchTerm = (categoryName && searchQuery === categoryName) ? '' : searchQuery;
        return getCausesBySearch(searchTerm || '', categoryId, pageParam);
      }
      // Use newSearch for other cases
      return newSearch(getTabValue(activeTab), searchQuery, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      // Check if there is a next URL
      if (lastPage.next) {
        try {
          // FIX: Use Regex instead of URL() to avoid crashes on relative paths in RN
          const match = lastPage.next.match(/[?&]page=(\d+)/);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        } catch (e) {
          return undefined;
        }
      }
      return undefined;
    },
    enabled: hasSearched && (searchQuery.trim().length > 0 || !!categoryId),
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setActiveTab('Causes');
  };

  const handleSurpriseMe = () => {
    // Get categories from route params if available
    const categories = (route.params as any)?.categories;

    if (categories && Array.isArray(categories) && categories.length > 0) {
      navigation.navigate('SurpriseMe' as never, { categories } as never);
    } else {
      navigation.navigate('SurpriseMe' as never);
    }
  };

  // Get results based on active tab from the unified search API response
  const getResults = () => {
    if (!searchData?.pages) return [];

    return searchData.pages.flatMap((page: any) => {
      // The API response structure may vary, but typically it returns results in a results array
      // or directly as an array. Let's handle both cases.
      if (Array.isArray(page)) {
        return page;
      }

      // Check for tab-specific properties first
      switch (activeTab) {
        case 'Causes':
          if (page.causes || page.cause) return page.causes || page.cause;
          break;
        case 'Collectives':
          if (page.collectives || page.collective) return page.collectives || page.collective;
          break;
        case 'Users':
          if (page.users || page.user) return page.users || page.user;
          break;
        case 'Posts':
          if (page.posts || page.post) return page.posts || page.post;
          break;
      }

      // If it's an object with a results property (fallback)
      if (page.results) {
        return page.results;
      }

      return [];
    });
  };

  const results = getResults();
  const isLoading = isLoadingSearch;
  const resultsCount = results.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      {hasSearched ? (
        <SearchResultsHeader
          searchQuery={searchQuery}
          onClearSearch={handleClearSearch}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
        />
      ) : (
        <View style={styles.header}>
          {/* <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Search</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasSearched ? (
          <>
            {/* Search Input */}
            <View style={styles.searchSection}>
              <View style={styles.inputContainer}>
                <SearchIcon size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* Not Sure Where to Start Section */}
            <View style={styles.surpriseSection}>
              <Text style={styles.sectionTitle}>NOT SURE WHERE TO START?</Text>
              <TouchableOpacity
                onPress={handleSurpriseMe}
                style={styles.surpriseCard}
                activeOpacity={0.7}
              >
                <View style={styles.surpriseContent}>
                  {/* Purple Gradient Icon with Star and Plus */}
                  <View style={styles.iconContainer}>
                    <Heart size={20} color="#FFFFFF" />
                    <View style={styles.plusBadge}>
                      <Plus size={8} color="#A855F7" />
                    </View>
                  </View>

                  <View style={styles.surpriseText}>
                    <Text style={styles.surpriseTitle}>Surprise Me</Text>
                    <Text style={styles.surpriseSubtitle}>
                      We'll pick 5 amazing nonprofits for you
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Results Header */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Results for '{searchQuery}'</Text>
            </View>

            {/* Tabs */}
            <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Results Section */}
            <View style={styles.resultsSection}>
              {/* Section Header */}
              <Text style={styles.sectionHeader}>
                {activeTab.toUpperCase()} ({resultsCount})
              </Text>

              {/* Results List */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#9CA3AF" />
                </View>
              ) : resultsCount > 0 ? (
                <>
                  <View style={styles.resultsList}>
                    {activeTab === 'Causes' &&
                      results.map((cause: any) => (
                        <CauseResultCard key={cause.id} cause={cause} />
                      ))}
                    {activeTab === 'Collectives' &&
                      results.map((collective: any) => (
                        <CollectiveResultCard key={collective.id} collective={collective} />
                      ))}
                    {activeTab === 'Users' &&
                      results.map((user: any) => (
                        <UserResultCard key={user.id} user={user} currentUserId={currentUser?.id?.toString()} />
                      ))}
                    {activeTab === 'Posts' &&
                      results.map((post: any) => (
                        <PostResultCard key={post.id} post={post} />
                      ))}
                  </View>

                  {/* Load More Button */}
                  {hasNextPage && (
                    <View style={styles.browseButtonContainer}>
                      <TouchableOpacity
                        onPress={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        style={[styles.browseButton, { marginTop: 16 }]}
                      >
                        {isFetchingNextPage ? (
                          <ActivityIndicator size="small" color="#111827" />
                        ) : (
                          <Text style={styles.browseButtonText}>Load More</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : activeTab === 'Causes' ? (
                <>
                  {/* Causes Empty State */}
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      No organizations found matching your search.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowRequestModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.requestLink}>
                        Can't find your nonprofit? Request it here
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Try searching for section */}
                  <View style={styles.categoriesSection}>
                    <Text style={styles.categoriesTitle}>Try searching for:</Text>
                    {['Animals', 'Homelessness', 'Mental Health', 'Health & Medical', 'Education', 'Environment'].map(
                      (category) => (
                        <Text key={category} style={styles.categoryItem}>
                          • {category}
                        </Text>
                      )
                    )}
                  </View>

                  {/* Browse All Nonprofits Button */}
                  <View style={styles.browseButtonContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery('');
                        setHasSearched(false);
                      }}
                      style={styles.browseButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.browseButtonText}>Browse All Nonprofits</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : activeTab === 'Collectives' ? (
                <>
                  {/* Collectives Empty State */}
                  <View style={styles.emptyState}>
                    <SearchIcon size={64} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>
                      No "{searchQuery}" collective found
                    </Text>
                    <Text style={styles.emptySubtitle}>Want to start one?</Text>
                  </View>

                  {/* Create Collective Button */}
                  <View style={styles.browseButtonContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        // TODO: Store searchQuery in AsyncStorage or pass as param
                        navigation.navigate('CreateCRWD' as never);
                      }}
                      style={[styles.browseButton, styles.createButton]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.browseButtonText, styles.createButtonText]}>
                        Create "{searchQuery}" Collective
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <SearchIcon size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>
                    No {activeTab.toLowerCase()} found for "{searchQuery}"
                  </Text>
                  <Text style={styles.emptySubtitle}>Try another search or switch tabs.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Request Nonprofit Modal */}
      <RequestNonprofitModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    fontFamily: 'Outfit-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingLeft: 40,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#F9FAFB',
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
  },
  surpriseSection: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontFamily: 'Outfit-Bold',
  },
  surpriseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  surpriseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surpriseText: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  surpriseSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
  resultsHeader: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  resultsSection: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontFamily: 'Outfit-Bold',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  requestLink: {
    fontSize: 14,
    color: '#1600ff',
    textDecorationLine: 'underline',
    fontFamily: 'Outfit-Regular',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  categoryItem: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  browseButtonContainer: {
    alignItems: 'center',
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  browseButtonText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  createButton: {
    backgroundColor: '#2c7fff',
    borderColor: '#2c7fff',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
});

