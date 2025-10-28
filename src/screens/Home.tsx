import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGreen, PrimaryGrey, SecondaryBlue } from '../Constants/Colors'
import { Search } from 'lucide-react-native'
import TopicList from '../components/TopicList'
import SuggestedCrwd from '../components/SuggestedCrwd'
import SuggestdCauses from '../components/SuggestdCauses'
import NearbyCauses from '../components/NearbyCauses'
import PopularPosts from '../components/PopularPosts'
import { SafeAreaView } from 'react-native-safe-area-context'
import HomeHeader from '../components/HomeHeader'
import CausesCarousel from '../components/CausesCarousel'
import { useNavigation } from '@react-navigation/native'
import { setDiscoverMode } from '../utils/discoverMode'
import { useQuery } from '@tanstack/react-query'
import { getPosts } from '../services/api/social'
import { getCauses, getCollectives, getCausesByLocation } from '../services/api/crwd'
import { useAuthStore } from '../store/store'
import { categories } from '../Constants/categories'



export default function Home() {
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const navigation = useNavigation();
    const { user: currentUser } = useAuthStore();

    // Fetch posts from API
    const { data: postsData, isLoading: isLoadingPosts, error: postsError } = useQuery({
        queryKey: ['posts', 'all'],
        queryFn: () => getPosts('', ''),
        enabled: true,
    });

    // Fetch causes from API
    const { data: causesData, isLoading: isLoadingCauses, error: causesError } = useQuery({
        queryKey: ['causes'],
        queryFn: getCauses,
        enabled: true,
    });

    // Fetch collectives from API
    const { data: collectivesData, isLoading: isLoadingCollectives, error: collectivesError } = useQuery({
        queryKey: ['collectives'],
        queryFn: getCollectives,
        enabled: true,
    });

    // Fetch causes by location (if location is available)
    const { data: causesByLocationData, isLoading: isLoadingLocationCauses, error: locationCausesError } = useQuery({
        queryKey: ['causesByLocation'],
        queryFn: () => getCausesByLocation(0, 0), // You can implement location detection here
        enabled: false, // Disable for now, enable when location is available
    });

    // Transform API response to match Post interface
    const posts = postsData?.results?.map((post: any) => ({
        id: String(post.id),
        avatarUrl: post.user?.profile_picture,
        username: post.user?.username || post.user?.full_name || 'Unknown User',
        userId: post.user?.id,
        time: new Date(post.created_at).toLocaleDateString(),
        org: post.collective?.name || 'Unknown Collective',
        text: post.content || '',
        imageUrl: post.media || undefined,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: 0, // API doesn't provide shares count
        isLiked: post.is_liked || false,
    })) || [];

    // Transform causes data for components
    const causes = causesData?.results?.map((cause: any) => ({
        id: String(cause.id),
        name: cause.name || 'Unknown Cause',
        description: cause.description || cause.mission || 'No description available',
        image: cause.image || require('../assets/images/redcross.png'),
        type: 'Nonprofit',
        category: cause.category || 'General',
        taxId: cause.tax_id_number || '',
        established: cause.established || cause.established_at || '',
        state: cause.state || '',
        city: cause.city || '',
        street: cause.street || '',
        is_favorite: cause.is_favorite || false,
    })) || [];

    // Transform collectives data for components
    const collectives = collectivesData?.results?.map((collective: any) => ({
        id: String(collective.id),
        name: collective.name || 'Unknown Collective',
        description: collective.description || 'No description available',
        members: `${collective.member_count || 0} Members`,
        image: collective.image || require('../assets/images/grocery.jpg'),
        createdBy: collective.created_by?.first_name + ' ' + collective.created_by?.last_name || 'Unknown Creator',
        isJoined: collective.is_joined || false,
        memberCount: collective.member_count || 0,
        adminCount: collective.admin_count || 0,
        is_favorite: collective.is_favorite || false,
    })) || [];

    // Transform location-based causes
    const nearbyCauses = causesByLocationData?.results?.map((cause: any) => ({
        id: String(cause.id),
        name: cause.name || 'Unknown Cause',
        description: cause.description || cause.mission || 'No description available',
        image: cause.image || require('../assets/images/redcross.png'),
        type: 'Nonprofit',
        category: cause.category || 'General',
        taxId: cause.tax_id_number || '',
        established: cause.established || cause.established_at || '',
        state: cause.state || '',
        city: cause.city || '',
        street: cause.street || '',
        is_favorite: cause.is_favorite || false,
    })) || [];

    // const categories = [
    //     {
    //       name: "Animals",
    //       text: "#E36414", // Orange-Red
    //       background: "#FFE1CC", // Softer warm orange tint
    //     },
    //     {
    //       name: "Environment",
    //       text: "#6A994E", // Olive Green
    //       background: "#DFF0D6", // Fresh leafy green tint
    //     },
    //     {
    //       name: "Food",
    //       text: "#FF9F1C", // Carrot Orange
    //       background: "#FFE6CC", // Light orange tint (not too pale)
    //     },
    //     {
    //       name: "Education",
    //       text: "#FFB84D", // Amber
    //       background: "#FFEFD1", // Gentle amber tint
    //     },
    //     {
    //       name: "Health",
    //       text: "#D62828", // Crimson
    //       background: "#FFD6D6", // Soft rosy red tint
    //     },
    //     {
    //       name: "Rights",
    //       text: "#780000", // Maroon
    //       background: "#F2C7C7", // Muted pinkish tint
    //     },
    //     {
    //       name: "Housing",
    //       text: "#8D6E63", // Brown
    //       background: "#EADFD9", // Warm earthy beige tint
    //     },
    //   ];

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoadingMore(false);
    };

    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}} edges={['top', 'left', 'right']}>
            <HomeHeader />
            <ScrollView style={{ paddingHorizontal: 20 }}>

                {/* Main Message */}
                <View style={{ 
                    padding: 24, 
                    alignItems: 'center', 
                    marginTop: 15,
                    marginBottom: 12,
                }}>
                    <Text style={{ 
                        fontSize: 20, 
                        fontWeight: '800', 
                        textAlign: 'center', 
                        marginBottom: 10,
                        lineHeight: 26,
                    }}
                    >
                        The easiest way to <Text style={{ color: PrimaryGreen, fontStyle: 'italic' }}>give</Text> to everything you care about, at once.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('SplashScreen' as never)} 
                        style={{ 
                            backgroundColor: PrimaryBlue, 
                            paddingVertical: 12, 
                            paddingHorizontal: 20, 
                            borderRadius: 10, 
                        }}
                    >
                        <Text style={{ 
                                fontSize: 16, 
                            color: 'white', 
                            fontWeight: '600',
                            textAlign: 'center',
                        }}>
                            Start Your Donation Box
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Causes Carousel */}
                <View style={{ marginBottom: 24 }}>
                    <CausesCarousel />
                </View>


                {/* <View style={{ 
                    marginVertical: 10, 
                    padding: 10, 
                    backgroundColor: LightGrey, 
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Search size={20} color={PrimaryGrey} style={{ marginRight: 8 }} />
                    <TextInput 
                        placeholder='Search' 
                        clearButtonMode="while-editing"
                        style={{ flex: 1 }}
                    />
                </View> */}

                {/* <TopicList /> */}

                {/* Suggested CRWDs Section */}
                <View>
                    {isLoadingCollectives ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading collectives...</Text>
                        </View>
                    ) : collectivesError ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'red', textAlign: 'center' }}>
                                Failed to load collectives. Please try again.
                            </Text>
                        </View>
                    ) : collectives.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
                                No collectives found
                            </Text>
                        </View>
                    ) : (
                        <SuggestedCrwd 
                            collectives={collectives}
                            isLoading={isLoadingCollectives}
                            error={collectivesError}
                        />
                    )}
                </View>

                {/* Categories Section */}
                <View style={{ marginTop: 32 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Explore Categories</Text>
                    <ScrollView 
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                    >
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {categories.map((category, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    onPress={() => navigation.navigate('Search' as never, { 
                                        categoryId: category.id, 
                                        categoryName: category.name 
                                    } as never)} 
                                    style={{
                                        backgroundColor: category.background,
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                    }}
                                >
                                    <Text style={{ 
                                        fontSize: 14, 
                                        color: category.text, 
                                        fontWeight: '500' 
                                    }}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    
                    {/* Discover More Button */}
                    <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Search' as never, { discover: true } as never)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Text style={{ 
                                fontSize: 14, 
                                color: '#2563eb', 
                                fontWeight: '500',
                                marginRight: 4
                            }}>
                                Discover More
                            </Text>
                            <Text style={{ fontSize: 16, color: '#2563eb' }}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Suggested Causes Section */}
                <View>
                   

                    {isLoadingCauses ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading causes...</Text>
                        </View>
                    ) : causesError ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'red', textAlign: 'center' }}>
                                Failed to load causes. Please try again.
                            </Text>
                        </View>
                    ) : causes.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
                                No causes found
                            </Text>
                        </View>
                    ) : (
                        <SuggestdCauses 
                            causes={causes}
                            isLoading={isLoadingCauses}
                            error={causesError}
                        />
                    )}
                </View>

                {/* Why CRWDs Section */}
                <View style={{ marginTop: 32, marginBottom: 24 }}>
                    <View style={{
                        backgroundColor: '#f8f9fa',
                        padding: 24,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#e9ecef',
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}>
                        <View style={{ alignItems: 'center', marginBottom: 18 }}>
                            <Text style={{
                                fontSize: 24,
                                fontWeight: '800',
                                color: '#495057',
                                marginBottom: 8,
                                textAlign: 'center'
                            }}>
                                Why CRWD?
                            </Text>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: '#6c757d',
                                
                                textAlign: 'center'
                            }}>
                                Giving should be simple
                            </Text>
                        </View>
                        <Text style={{
                            textAlign: 'center',
                            color: '#6c757d',
                            lineHeight: 24,
                            fontSize: 16
                        }}>
                            On CRWD, one donation supports all the causes you care about. You're not just donating, you're joining others who care about the same things, creating bigger impact together.
                        </Text>
                    </View>
                </View>

                {/* Nearby Causes Section */}
                <View style={{ marginTop: 32 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Nearby Causes</Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Search' as never)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '500', marginRight: 4 }}>
                                View All
                            </Text>
                            <Text style={{ fontSize: 16, color: '#2563eb' }}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingLocationCauses ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading nearby causes...</Text>
                        </View>
                    ) : locationCausesError ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'red', textAlign: 'center' }}>
                                Failed to load nearby causes. Please try again.
                            </Text>
                        </View>
                    ) : nearbyCauses.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
                                No nearby causes found
                            </Text>
                        </View>
                    ) : (
                        <NearbyCauses 
                            causes={nearbyCauses}
                            isLoading={isLoadingLocationCauses}
                            error={locationCausesError}
                        />
                    )}
                </View>

                {/* Popular Posts Section */}
                <View >
                    

                    {isLoadingPosts ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={PrimaryBlue} />
                            <Text style={{ marginTop: 10, color: PrimaryGrey }}>Loading posts...</Text>
                        </View>
                    ) : postsError ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'red', textAlign: 'center' }}>
                                Failed to load posts. Please try again.
                            </Text>
                        </View>
                    ) : posts.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: PrimaryGrey, textAlign: 'center' }}>
                                No posts found
                            </Text>
                        </View>
                    ) : (
                        <PopularPosts
                            posts={posts}
                            onLoadMore={handleLoadMore}
                            hasMore={true}
                        />
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}