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
import { useQuery } from '@tanstack/react-query'
import { getCausesBySearch } from '../services/api/crwd'
import { categories } from '../Constants/categories'
import { History } from 'lucide-react-native'
import { TrendingUp } from 'lucide-react-native'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar'


export default function SearchScreen() {
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
    const navigation = useNavigation()
    const route = useRoute()
    
    // Check discover mode and route parameters when screen comes into focus
    useFocusEffect(useCallback(() => {
        console.log('Search screen focus effect triggered');
        
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
        }
    }, [route.params]))

    // Get causes with search and category filtering
    const { data: causesData, isLoading: isCausesLoading, error } = useQuery({
        queryKey: ['causes', selectedCategory, searchTrigger, currentPage],
        queryFn: () => {
            return getCausesBySearch(searchQuery, selectedCategory === "All" || selectedCategory === "" ? '' : selectedCategory, currentPage);
        },
        enabled: (!discover && searchQuery.trim().length > 0) || (!discover && selectedCategory !== "All" && selectedCategory !== ""),
    });


    // Handle API response and accumulate results
    useEffect(() => {
        if (causesData?.results) {
            if (currentPage === 1) {
                setAllCauses(causesData.results);
            } else {
                setAllCauses(prev => [...prev, ...causesData.results]);
            }
        }
    }, [causesData, currentPage]);

    // Reset page when search or category changes
    useEffect(() => {
        setCurrentPage(1);
        setAllCauses([]);
    }, [searchTrigger, selectedCategory]);

    // Trigger search when category changes (only in non-discover mode)
    useEffect(() => {
        if (!discover && selectedCategory !== "All" && selectedCategory !== "") {
            setSearchTrigger(prev => prev + 1);
        }
    }, [selectedCategory, discover]);

    // Show search results when typing, show default content when empty
    const showSearchResults = search.trim().length > 0 || searchQuery.trim().length > 0
    
    const [recentSearches, setRecentSearches] = useState([
        "Atlanta animal shelters", 
        "Gaza support efforts", 
        "Marine wildlife charities"
    ])
    
    const [popularSearches, setPopularSearches] = useState([
        "Protests near me", 
        "Harvard opens free classes to public"
    ])

    const removeRecentSearch = (index: number) => {
        setRecentSearches(prev => prev.filter((_, i) => i !== index))
    }

    const removePopularSearch = (index: number) => {
        setPopularSearches(prev => prev.filter((_, i) => i !== index))
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
                                        onPress={() => setSelectedCategory(selectedCategory === category.id ? "All" : category.id)}
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
                                onPress={() => setSelectedCategory("All")}
                            >
                                <Text style={{ 
                                    fontSize: 14, 
                                    color: selectedCategory === "All" || selectedCategory === "" ? "#ffffff" : "#000000",
                                    fontWeight: '500' 
                                }}>
                                    All
                                </Text>
                            </TouchableOpacity> */}

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
                                    onPress={() => setSelectedCategory(category.id)}
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
                
                {/* Search Results - Show when typing */}
                {causesData?.results?.length > 0 && (
                    <>
                        {/* Results Header */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                                {searchQuery ? `Search results for "${searchQuery}" in ${categories.find(cat => cat.id === selectedCategory)?.name}` : 
                                 (selectedCategory !== "All" && selectedCategory !== "") ? 
                                 `Causes in ${categories.find(cat => cat.id === selectedCategory)?.name}` : 
                                 "Causes near you"}
                                 
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
                                        onPress={() => navigation.navigate('CauseScreen' as never, { causeId: cause.id } as never)}
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
                                                    <AvatarFallback style={{ backgroundColor: '#dbeafe' }} textStyle={{ color: '#2563eb', fontWeight: '600' }}>
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
                                    {searchQuery ? `No causes found for "${searchQuery}" in ${categories.find(cat => cat.id === selectedCategory)?.name}` : 
                                     (selectedCategory !== "All" && selectedCategory !== "") ? 
                                     `No causes found in ${categoryName || categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}` : 
                                     "No causes available"}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Default Content - Show when not searching */}
                {(!causesData || causesData?.results?.length === 0) && (
                    <>

                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: PrimaryGrey }}>No results found</Text>
                        <Text style={{ fontSize: 14, fontWeight: '400', color: PrimaryGrey }}>Try searching for a different term or category</Text>
                      
                    </View>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            {/* <Text style={{ fontSize: 20, marginRight: 8 }}>🕒</Text> */}
                            <History size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: PrimaryGrey }}>Recent Searches</Text>
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
                            {recentSearches.map((searchTerm, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 15,
                                        paddingHorizontal: 15,
                                        borderBottomWidth: index < recentSearches.length - 1 ? 1 : 0,
                                        borderBottomColor: LightGrey,
                                    }}
                                    onPress={() => navigation.navigate('Search2' as never)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ 
                                            padding: 8, 
                                            // backgroundColor: LightGrey, 
                                            // borderRadius: 20, 
                                            // marginRight: 12 
                                        }}>
                                            {/* <Text style={{ fontSize: 16 }}>🕒</Text> */}
                                            <History size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '500', flex: 1 }}>{searchTerm}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            removeRecentSearch(index)
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
                            {/* <Text style={{ fontSize: 20, marginRight: 8 }}>🔥</Text> */}
                            <TrendingUp size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
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
                            {popularSearches.map((searchTerm, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 15,
                                        paddingHorizontal: 15,
                                        borderBottomWidth: index < popularSearches.length - 1 ? 1 : 0,
                                        borderBottomColor: LightGrey,
                                    }}
                                    onPress={() => navigation.navigate('Search2' as never)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ 
                                            padding: 8, 
                                            // backgroundColor: LightGrey, 
                                            // borderRadius: 20, 
                                            // marginRight: 12 
                                        }}>
                                            {/* <Text style={{ fontSize: 16 }}>🔥</Text> */}
                                            <TrendingUp size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '500', flex: 1 }}>{searchTerm}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation()
                                            removePopularSearch(index)
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
                                            setShowCategorySelector(false);
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
                                                setShowCategorySelector(false);
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