import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCausesBySearch } from '../services/api/crwd';
import { newSearch } from '../services/api/social';
import SearchResultsHeader from '../components/newsearch/SearchResultsHeader';
import SearchTabs from '../components/newsearch/SearchTabs';
import CauseResultCard from '../components/newsearch/CauseResultCard';
import CollectiveResultCard from '../components/newsearch/CollectiveResultCard';
import UserResultCard from '../components/newsearch/UserResultCard';
import PostResultCard from '../components/newsearch/PostResultCard';
import RequestNonprofitModal from '../components/newsearch/RequestNonprofitModal';
import { Search as SearchIcon } from 'lucide-react-native';

import { useAuthStore } from '../store/store';
import { normalizeSearchText } from '../utils/textNormalization';

export default function SearchResults() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as any;
    const { user: currentUser } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState(params?.searchQuery || '');
    const [activeTab, setActiveTab] = useState(params?.tab || 'Nonprofits');
    const [showRequestModal, setShowRequestModal] = useState(false);

    // Update searchQuery if params change
    useEffect(() => {
        if (params?.searchQuery) {
            setSearchQuery(params.searchQuery);
        }
        if (params?.tab) {
            setActiveTab(params.tab);
        }
    }, [params]);

    const mapTabToApiValue = (tab: string) => {
        switch (tab) {
            case 'Nonprofits': return 'cause';
            case 'Giving Groups': return 'collective';
            case 'Users': return 'user';
            case 'Posts': return 'post';
            default: return 'cause';
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useInfiniteQuery({
        queryKey: ['search', searchQuery, activeTab],
        queryFn: async ({ pageParam = 1 }) => {
            if (activeTab === 'Nonprofits') {
                const categoryId = params?.categoryId;
                // If searching by category, use that endpoint
                if (categoryId && (!searchQuery || searchQuery === params?.categoryName)) {
                    return getCausesBySearch('', categoryId, pageParam);
                }
                return getCausesBySearch(searchQuery, '', pageParam);
            }
            return newSearch(mapTabToApiValue(activeTab), searchQuery, pageParam);
        },
        getNextPageParam: (lastPage: any) => {
            if (lastPage.next) {
                const match = lastPage.next.match(/[?&]page=(\d+)/);
                return match ? parseInt(match[1]) : undefined;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!searchQuery || !!params?.categoryId,
    });

    const getResults = () => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => {
            if (activeTab === 'Nonprofits') {
                return page.results || page.causes || page.cause || [];
            }
            switch (activeTab) {
                case 'Giving Groups': return page.collectives || page.collective || page.results || [];
                case 'Users': return page.users || page.user || page.results || [];
                case 'Posts': return page.posts || page.post || page.results || [];
                default: return page.results || [];
            }
        });
    };

    const results = getResults();
    const resultsCount = data?.pages?.[0]?.count || results.length;

    const handleSearch = () => {
        const normalized = normalizeSearchText(searchQuery);
        if (normalized !== searchQuery) {
            setSearchQuery(normalized);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        switch (activeTab) {
            case 'Nonprofits':
                return <CauseResultCard cause={item} />;
            case 'Giving Groups':
                return <CollectiveResultCard collective={item} />;
            case 'Users':
                return <UserResultCard user={item} currentUserId={currentUser?.id?.toString()} />;
            case 'Posts':
                return <PostResultCard post={item} />;
            default:
                return null;
        }
    };

    const renderEmptyState = () => {
        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c7fff" />
                </View>
            );
        }

        if (activeTab === 'Nonprofits') {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No organizations found matching your search.</Text>
                    <TouchableOpacity onPress={() => setShowRequestModal(true)}>
                        <Text style={styles.requestLink}>Can't find your nonprofit? Request it here</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => {
                            setSearchQuery('');
                            navigation.setParams({ searchQuery: '' } as any);
                        }}
                    >
                        <Text style={styles.browseButtonText}>Browse All Nonprofits</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (activeTab === 'Giving Groups') {
            return (
                <View style={styles.emptyContainer}>
                    <View style={styles.iconBg}>
                        <SearchIcon size={32} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyTitle}>No "{searchQuery}" Giving Groups found</Text>
                    <Text style={styles.emptySubtitle}>Want to start one?</Text>

                    <TouchableOpacity
                        style={[styles.createButton, { marginTop: 16 }]}
                        onPress={() => {
                            // Define navigation to create collective
                            // navigation.navigate('CreateCRWD', { name: searchQuery });
                            // Or store in some state
                            navigation.navigate('CreateCRWD' as never);
                        }}
                    >
                        <Text style={styles.createButtonText}>Create "{searchQuery}" Collective</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.iconBg}>
                    <SearchIcon size={32} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} found for "{searchQuery}"</Text>
                <Text style={styles.emptySubtitle}>Try another search or switch tabs.</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SearchResultsHeader
                searchQuery={searchQuery}
                onSearchChange={(text) => {
                    setSearchQuery(text);
                }}
                onSearch={handleSearch}
                onClearSearch={() => navigation.goBack()}
                onBack={() => navigation.goBack()}
            />

            <View style={styles.content}>
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>Results for '{searchQuery}'</Text>
                </View>

                <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <View style={styles.tabHeader}>
                    <Text style={styles.tabTitle}>{activeTab.toUpperCase()} ({resultsCount})</Text>
                </View>

                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={
                        hasNextPage ? (
                            <View style={styles.loadMoreContainer}>
                                <TouchableOpacity
                                    style={styles.loadMoreButton}
                                    onPress={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color="#6B7280" style={{ marginRight: 8 }} />
                                            <Text style={styles.loadMoreText}>Loading...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.loadMoreText}>Load More</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : isFetchingNextPage ? (
                            <View style={styles.bottomLoader}>
                                <ActivityIndicator size="small" color="#2c7fff" />
                            </View>
                        ) : (
                            <View style={{ height: 40 }} />
                        )
                    }
                />
            </View>

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
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    resultsHeader: {
        marginBottom: 16,
        marginTop: 8,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    tabHeader: {
        marginTop: 20,
        marginBottom: 12,
    },
    tabTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        fontFamily: 'Outfit-Bold',
        textTransform: 'uppercase',
    },
    listContent: {
        paddingBottom: 20,
        gap: 12,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 8,
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Outfit-SemiBold',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'Outfit-Regular',
    },
    requestLink: {
        fontSize: 14,
        color: '#2563EB',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'Outfit-Medium',
    },
    browseButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    browseButtonText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
    iconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    createButton: {
        backgroundColor: '#2c7fff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'Outfit-SemiBold',
    },
    bottomLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    loadMoreContainer: {
        marginTop: 10,
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadMoreButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadMoreText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
});
