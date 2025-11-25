import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import SuggestdCauses from '../components/SuggestdCauses'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Search } from 'lucide-react-native'
import NearbyCauses from '../components/NearbyCauses'
import { getDiscoverMode, resetDiscoverMode } from '../utils/discoverMode'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCausesBySearch, getCauses } from '../services/api/crwd'
import { getRecentSearches, createRecentSearch, deleteRecentSearch } from '../services/api/social'
import { useAuthStore } from '../store/store'
import { categories } from '../Constants/categories'
// Icons replaced with emoji for compatibility
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'
import { getNonprofitColor } from '../utils/getNonprofitColor'
import { Clock } from 'lucide-react-native'
import { TrendingUp } from 'lucide-react-native'


export default function SearchScreen() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [discover, setDiscover] = useState(false) // Always start with false
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [categoryName, setCategoryName] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [searchTrigger, setSearchTrigger] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [allCauses, setAllCauses] = useState<any[]>([])
    const [showCategorySelector, setShowCategorySelector] = useState(false)
    const [search, setSearch] = useState("")
    const [hasExitedDiscover, setHasExitedDiscover] = useState(false) // Track if user has manually exited discover mode
    const navigation = useNavigation()
    const route = useRoute()
    
    // Check discover mode and route parameters when screen comes into focus
    useFocusEffect(useCallback(() => {
        console.log('Search screen focus effect triggered');
        
        // If user has manually exited discover mode, don't reset it
        if (hasExitedDiscover) {
            return;
        }
        
        // Get route parameters
        const params = route.params as any;
        if (params) {
            if (params.discover) {
                console.log('Setting discover to true from route params');
                setDiscover(true);
            }
            if (params.categoryId) {
                console.log('Setting category from route params:', params.categoryId, params.categoryName);
                setCategoryId(params.categoryId);
                setCategoryName(params.categoryName);
                setSelectedCategory(params.categoryId);
                setSearchQuery(""); // Don't set search query to category name
                setSearchTrigger(prev => prev + 1);
            }
        }
        
        // Check if discover mode should be shown from global variable
        if (getDiscoverMode()) {
            console.log('Setting discover to true from global variable');
            setDiscover(true)
            // Reset the global variable after using it
            resetDiscoverMode()
        } else if (!params?.discover) {
            console.log('Setting discover to false - no discover mode set');
            setDiscover(false)
            
            // Don't auto-trigger search - only on Enter key press
        }
    }, [route.params, selectedCategory, hasExitedDiscover]))

    // Get recent searches (only if user is logged in)
    const { data: recentSearchesData } = useQuery({
        queryKey: ['recentSearches'],
        queryFn: () => getRecentSearches(),
        enabled: !!currentUser?.id,
        refetchOnMount: true,
    });

    // Update recent searches list when data is available (limit to 5)
    useEffect(() => {
        if (recentSearchesData?.results) {
            const searches = recentSearchesData.results
                .slice(0, 5) // Limit to 5 items
                .map((item: any) => ({
                    id: item.id,
                    search_query: item.search_query
                }));
            setRecentSearches(searches);
        }
    }, [recentSearchesData]);

    // Create recent search mutation
    const createRecentSearchMutation = useMutation({
        mutationFn: (search_query: string) => createRecentSearch(search_query),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
            queryClient.refetchQueries({ queryKey: ['recentSearches'] });
        },
    });

    // Delete recent search mutation
    const deleteRecentSearchMutation = useMutation({
        mutationFn: (searchId: string) => deleteRecentSearch(searchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
            queryClient.refetchQueries({ queryKey: ['recentSearches'] });
        },
    });

    // Get causes with search and category filtering (only when searchTrigger is set)
    const { data: causesData, isLoading: isCausesLoading, error } = useQuery({
        queryKey: ['causes', selectedCategory, searchQuery, searchTrigger, currentPage],
        queryFn: () => {
            return getCausesBySearch(searchQuery, selectedCategory === "All" || selectedCategory === "" ? '' : selectedCategory, currentPage);
        },
        enabled: searchTrigger > 0, // Only enabled when search is triggered (not on mount)
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });


    // Handle API response and accumulate results, and save to recent searches
    useEffect(() => {
        if (causesData?.results) {
            if (currentPage === 1) {
                setAllCauses(causesData.results);
                // Save to recent searches on successful search (only if user is logged in)
                if (searchQuery.trim() && currentUser?.id) {
                    createRecentSearchMutation.mutate(searchQuery.trim());
                }
            } else {
                setAllCauses(prev => [...prev, ...causesData.results]);
            }
        }
    }, [causesData, currentPage, searchQuery, currentUser?.id]);

    // Reset page when search or category changes
    useEffect(() => {
        setCurrentPage(1);
        setAllCauses([]);
    }, [searchTrigger, selectedCategory]);

    // Don't auto-trigger search - only on Enter key press

    // Show search results when typing, show default content when empty
    const showSearchResults = search.trim().length > 0 || searchQuery.trim().length > 0
    
    const [recentSearches, setRecentSearches] = useState<Array<{ id: number; search_query: string }>>([])
    
    const [popularSearches, setPopularSearches] = useState<any[]>([])

    // Fetch nonprofits for popular searches
    const { data: nonprofitsData, isLoading: isNonprofitsLoading } = useQuery({
        queryKey: ['nonprofits'],
        queryFn: () => getCauses(),
        enabled: true,
    });

    // Update popular searches list with nonprofits when data is available
    useEffect(() => {
        if (nonprofitsData?.results && nonprofitsData.results.length > 0) {
            // Take first few nonprofits (limit to 5 or available)
            const nonprofits = nonprofitsData.results.slice(0, 5).map((nonprofit: any) => ({
                id: nonprofit.id,
                name: nonprofit.name,
            }));
            setPopularSearches(nonprofits);
        }
    }, [nonprofitsData]);

    const removeRecentSearch = (searchId: number) => {
        if (currentUser?.id) {
            deleteRecentSearchMutation.mutate(searchId.toString());
        }
    }

    const handleRecentSearchClick = (searchQuery: string) => {
        // Set the search query and trigger search
        setSearch(searchQuery);
        setSearchQuery(searchQuery);
        setSearchTrigger(prev => prev + 1);
        setDiscover(false);
    }

    const removePopularSearch = (index: number) => {
        // Don't allow removing nonprofits from popular searches
        // They are fetched from API, so we don't remove them
    }

    // Handle search input with Enter key
    const handleSearchSubmit = () => {
        if (search.trim()) {
            setSearchQuery(search.trim());
            setSearchTrigger(prev => prev + 1);
            // Switch from discover mode to search mode when user searches
            if (discover) {
                setDiscover(false);
            }
        }
    }


    // If in discover mode, show discover-focused layout
    if (discover) {
        return (
            <SafeAreaView style={{ backgroundColor: '#f9fafb', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav menu={false} show title={'Search'} />
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
                        {/* Title and Description */}
                        <View style={{ alignItems: 'center', marginBottom: 32 }}>
                            <Text style={{ 
                                fontSize: 30, 
                                fontWeight: '700', 
                                color: '#111827', 
                                marginBottom: 16,
                                textAlign: 'center'
                            }}>
                                Discover Your Impact
                            </Text>
                            <Text style={{ 
                                fontSize: 18, 
                                color: '#6b7280', 
                                textAlign: 'center',
                                lineHeight: 24,
                                maxWidth: 350
                            }}>
                                Find and support organizations that align with your passions. Your next favorite cause is just a click away.
                            </Text>
                        </View>

                        {/* Search Input for discover mode */}
                        <View style={{ marginBottom: 32, alignItems: 'center' }}>
                            <View style={{ 
                                    width: '100%',
                                    maxWidth: 500,
                                    backgroundColor: 'white', 
                                    borderRadius: 25, 
                                    flexDirection: 'row', 
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 16,
                                    borderWidth: 2,
                                    borderColor: '#e5e7eb',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 1,
                            }}>
                                <Search size={20} color={PrimaryGrey} style={{ marginRight: 12 }} />
                                <TextInput 
                                    placeholder="Search for nonprofits or causes..."
                                    placeholderTextColor="#9ca3af"
                                    value={search}
                                    onChangeText={setSearch}
                                    onSubmitEditing={handleSearchSubmit}
                                    returnKeyLabel='search'
                                    style={{ 
                                    flex: 1, 
                                    fontSize: 16, 
                                        color: '#111827'
                                    }}
                                    returnKeyType="search"
                                />
                            </View>
                        </View>

                        {/* Category Filters - Centered and non-scrollable */}
                        <View style={{ marginBottom: 32, alignItems: 'center' }}>
                            <View style={{ 
                                flexDirection: 'row', 
                                flexWrap: 'wrap', 
                                justifyContent: 'center',
                                gap: 8,
                                width: '100%',
                                maxWidth: 400
                            }}>
                                {/* All Categories Button */}
  

                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={{
                                            backgroundColor: selectedCategory === category.id 
                                                ? category.text 
                                                : category.background,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: '#E5E7EB',
                                        }}
                                        onPress={() => {
                                            const newCategory = selectedCategory === category.id ? "All" : category.id;
                                            setSelectedCategory(newCategory);
                                            setSearchQuery("");
                                            setSearchTrigger(prev => prev + 1);
                                            // If in discover mode, exit discover mode and show search results
                                            if (discover) {
                                                setDiscover(false);
                                                setHasExitedDiscover(true); // Mark that user has exited discover mode
                                            }
                                        }}
                                    >
                                        <Text style={{ 
                                            fontSize: 14, 
                                            color: selectedCategory === category.id 
                                                ? "white" 
                                                : category.text,
                                            fontWeight: '500' 
                                        }}>
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                     
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}} edges={['top', 'left', 'right']}>
            <MainHeaderNav title={'Search'} show menu={false} />
            <ScrollView style={{ paddingHorizontal: 20 }}>
                <View style={{ 
                    marginVertical: 10, 
                    padding: 10, 
                    backgroundColor: LightGrey, 
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Search size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                    <TextInput 
                        placeholder='Search for non-profits CRWDs, or posts' 
                        placeholderTextColor={PrimaryGrey}
                        value={search}
                    onChangeText={setSearch}
                        onSubmitEditing={handleSearchSubmit}
                        clearButtonMode="while-editing"
                        style={{ flex: 1 }}
                        returnKeyType="search"
                    />
                </View>

                {/* Category Filter Buttons */}
                <View style={{ marginVertical: 10 }}>
                    <ScrollView 
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                    >
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {/* All Categories Button */}
                            {/* <TouchableOpacity 
                                style={{
                                    backgroundColor: selectedCategory === "All" || selectedCategory === "" ? "#000000" : "#f5f5f5",
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                }}
                                onPress={() => {
                                    setSelectedCategory("All");
                                    setSearchQuery("");
                                    setSearchTrigger(prev => prev + 1);
                                }}
                            >
                                <Text style={{ 
                                    fontSize: 14, 
                                    color: selectedCategory === "All" || selectedCategory === "" ? "#ffffff" : "#000000",
                                    fontWeight: '500' 
                                }}>
                                    All
                                </Text>
                            </TouchableOpacity>

                            {/* Category Buttons */}
                            {categories.map((category, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    style={{
                                        backgroundColor: selectedCategory === category.id ? category.text : category.background,
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                    }}
                                    onPress={() => {
                                        setSelectedCategory(category.id);
                                        setSearchQuery("");
                                        setSearchTrigger(prev => prev + 1);
                                        // If in discover mode, exit discover mode and show search results
                                        if (discover) {
                                            setDiscover(false);
                                            setHasExitedDiscover(true); // Mark that user has exited discover mode
                                        }
                                    }}
                                >
                                    <Text style={{ 
                                        fontSize: 14, 
                                        color: selectedCategory === category.id ? "#ffffff" : category.text,
                                        fontWeight: '500' 
                                    }}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
                
                {/* Search Results - Show when data exists or loading */}
                {(causesData?.results?.length > 0 || isCausesLoading || allCauses.length > 0) && (
                    <>
                        {/* Results Header */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                                {searchQuery ? `Search results for "${searchQuery}"` : 
                                 (selectedCategory !== "All" && selectedCategory !== "") ? 
                                 "Causes" : "Causes"}
                                 
                            </Text>
                        </View>

                        {/* Loading State */}
                        {isCausesLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={PrimaryBlue} />
                                <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading causes...</Text>
                            </View>
                        ) : error ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: 'red', textAlign: 'center' }}>
                                    Error loading causes. Please try again.
                                </Text>
                            </View>
                        ) : allCauses.length > 0 ? (
                            <View>
                                {allCauses.map((cause: any, index: number) => (
                                    <TouchableOpacity 
                                        key={cause.id || index}
                                        onPress={() => (navigation as any).navigate('CauseScreen', { causeId: cause.id })}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 16,
                                            marginBottom: 8,
                                            backgroundColor: 'white',
                                            borderRadius: 8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#f0f0f0', marginRight: 12 }}>
                                                {/* <Image
                                                    source={{ uri: cause.image || 'https://via.placeholder.com/40' }}
                                                    style={{ width: '100%', height: '100%' }}
                                                /> */}
                                                <Avatar size={40}>
                                                    <AvatarImage src={cause.image} />
                                                    <AvatarFallback style={{ backgroundColor: getNonprofitColor(cause.id).bgColor }} textStyle={{ color: getNonprofitColor(cause.id).textColor, fontWeight: '600' }}>
                                                        {cause.name.split(' ')[0][0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </View>
                                            <View style={{ flex: 1, minWidth: 0 }}>
                                                <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 }}>
                                                    <Text style={{ color: '#0369a1', fontSize: 12, fontWeight: '600' }}>
                                                        Nonprofit
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 2 }}>
                                                    {cause.name}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: PrimaryGrey, lineHeight: 16 }}>
                                                    {cause.description || cause.mission || "No description available"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'center', gap: 8 }}>
                                            <TouchableOpacity 
                                                style={{ backgroundColor: PrimaryBlue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                                            >
                                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                                                    Donate Now
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity>
                                                <Text style={{ color: PrimaryBlue, fontSize: 12 }}>
                                                    Visit Profile
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                
                                {/* Load More Button */}
                                {causesData?.next && (
                                    <View style={{ alignItems: 'flex-end', marginTop: 10, marginBottom: 32 }}>
                                        <TouchableOpacity 
                                            onPress={() => setCurrentPage(prev => prev + 1)}
                                            style={{ flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <Text style={{ fontSize: 14, color: PrimaryBlue, fontWeight: '500', marginRight: 4 }}>
                                                Load More
                                            </Text>
                                            <Text style={{ fontSize: 16, color: PrimaryBlue }}>›</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
                                    {searchQuery ? `No causes found for "${searchQuery}"` : 
                                     (selectedCategory !== "All" && selectedCategory !== "") ? 
                                     "No causes found" : "No causes available"}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Default Content - Show when not searching and not loading */}
                {(!causesData || causesData?.results?.length === 0) && !isCausesLoading && allCauses.length === 0 && (
                    <>

                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: PrimaryGrey }}>No results found</Text>
                        <Text style={{ fontSize: 14, fontWeight: '400', color: PrimaryGrey }}>Try searching for a different term or category</Text>
                      
                    </View>

                {/* Recent Searches - Only show if user is logged in */}
                {currentUser?.id && recentSearches.length > 0 && allCauses.length === 0 && (
                    <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            {/* <Text style={{ fontSize: 16, marginRight: 8 }}>🕒</Text> s*/}
                            <Clock size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: PrimaryGrey }}>Recent Searches</Text>
                        </View>
                        <View style={{ 
                            backgroundColor: 'white',
                            borderRadius: 12,
                        }}>
                            {recentSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id || index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 15,
                                        paddingHorizontal: 15,
                                        borderBottomWidth: index < recentSearches.length - 1 ? 1 : 0,
                                        borderBottomColor: LightGrey,
                                    }}
                                    onPress={() => handleRecentSearchClick(item.search_query)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ 
                                            padding: 4, 
                                        }}>
                                            {/* <Text style={{ fontSize: 16, marginRight: 8 }}>🕒</Text> */}
                                            <Clock size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '500', flex: 1 }}>{item.search_query}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            removeRecentSearch(item.id)
                                        }}
                                        style={{ padding: 4 }}
                                    >
                                        <Text style={{ fontSize: 16, color: PrimaryGrey }}>✕</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Popular Searches */}
                {popularSearches.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <View style={{ 
                                width: 20, 
                                height: 20, 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                marginRight: 8 
                            }}>
                                {/* <Text style={{ fontSize: 18, color: PrimaryGrey }}>⚡</Text> */}
                                <TrendingUp size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: PrimaryGrey }}>Popular Searches</Text>
                        </View>
                        <View style={{ 
                            backgroundColor: 'white',
                            borderRadius: 12,
                           // shadowColor: '#000',
                           // shadowOffset: { width: 0, height: 1 },
                           // shadowOpacity: 0.1,
                           // shadowRadius: 3,
                           // elevation: 2,
                        }}>
                            {popularSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id || index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 15,
                                        paddingHorizontal: 15,
                                        borderBottomWidth: index < popularSearches.length - 1 ? 1 : 0,
                                        borderBottomColor: LightGrey,
                                    }}
                                    onPress={() => {
                                        if (item.id) {
                                            (navigation as any).navigate('CauseScreen', { causeId: item.id });
                                        } else {
                                            navigation.navigate('Search2' as never);
                                        }
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ 
                                            padding: 8,
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: 20,
                                            marginRight: 12,
                                            width: 32,
                                            height: 32,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            {/* <Text style={{ fontSize: 14, color: '#4b5563' }}>📈</Text> */}
                                            <TrendingUp size={20} color={PrimaryGrey} />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '500', flex: 1 }}>
                                            {item.name || item}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                    </>
                )}

                {/* Category Selector Modal */}
                {showCategorySelector && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showCategorySelector}
                        onRequestClose={() => setShowCategorySelector(false)}
                    >
                        <View style={{ 
                            flex: 1, 
                            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                            justifyContent: 'flex-end' 
                        }}>
                            <View style={{ 
                                backgroundColor: 'white', 
                                borderTopLeftRadius: 20, 
                                borderTopRightRadius: 20,
                                maxHeight: '80%'
                            }}>
                                {/* Header */}
                                <View style={{ 
                                    flexDirection: 'row', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: 16, 
                                    borderBottomWidth: 1, 
                                    borderBottomColor: '#e5e7eb' 
                                }}>
                                    <Text style={{ fontSize: 18, fontWeight: '600' }}>Select Category</Text>
                                    <TouchableOpacity 
                                        onPress={() => setShowCategorySelector(false)}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 20, color: PrimaryGrey }}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Categories List */}
                                <ScrollView style={{ maxHeight: 300, padding: 16 }}>
                                    {/* All Categories Option */}
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 12,
                                            marginBottom: 8,
                                            backgroundColor: selectedCategory === "All" ? "#f5f5f5" : "#f5f5f5",
                                            borderRadius: 8,
                                        }}
                                        onPress={() => {
                                            setSelectedCategory("All");
                                            setSearchQuery("");
                                            setSearchTrigger(prev => prev + 1);
                                            setShowCategorySelector(false);
                                            // If in discover mode, exit discover mode and show search results
                                            if (discover) {
                                                setDiscover(false);
                                                setHasExitedDiscover(true); // Mark that user has exited discover mode
                                            }
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#000000' }}>
                                            All Categories
                                        </Text>
                                        {selectedCategory === "All" && <Text style={{ color: PrimaryBlue }}>✓</Text>}
                                    </TouchableOpacity>

                                    {/* Category Options */}
                                    {categories.map((category, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 12,
                                                marginBottom: 8,
                                                backgroundColor: category.background,
                                                borderRadius: 8,
                                            }}
                                            onPress={() => {
                                                setSelectedCategory(category.id);
                                                setSearchQuery("");
                                                setSearchTrigger(prev => prev + 1);
                                                setShowCategorySelector(false);
                                                // If in discover mode, exit discover mode and show search results
                                                if (discover) {
                                                    setDiscover(false);
                                                    setHasExitedDiscover(true); // Mark that user has exited discover mode
                                                }
                                            }}
                                        >
                                            <Text style={{ 
                                                fontSize: 16, 
                                                fontWeight: '500', 
                                                color: category.text 
                                            }}>
                                                {category.name}
                                            </Text>
                                            {selectedCategory === category.id && <Text style={{ color: PrimaryBlue }}>✓</Text>}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}