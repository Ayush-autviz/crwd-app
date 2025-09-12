import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import SuggestdCauses from '../components/SuggestdCauses'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Clock, TrendingUp, X, Search } from 'lucide-react-native'
import NearbyCauses from '../components/NearbyCauses'
import { getDiscoverMode, resetDiscoverMode } from '../utils/discoverMode'


// Sample data generator for infinite posts
const generateMorePosts = (startId: number, count: number) => {
    return Array.from({ length: count }, (_, index) => ({
        id: String(startId + index),
        avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`,
        username: `user${startId + index}`,
        time: `${Math.floor(Math.random() * 7)}d`,
        org: ["youth4change", "cleanwaternow", "treeplanters", "literacyforall"][Math.floor(Math.random() * 4)],
        text: [
            "Making a difference in our community one step at a time! 🌟",
            "Another successful volunteer event completed! Thank you to all participants! 🙏",
            "Working together for a better tomorrow. Join us in our mission! 💪",
            "Every small action counts. Let's create positive change together! ✨"
        ][Math.floor(Math.random() * 4)],
        imageUrl: Math.random() > 0.5 ? `https://picsum.photos/600/400?random=${startId + index}` : undefined,
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10),
    }));
};

export default function SearchScreen() {
    const [discover, setDiscover] = useState(false) // Always start with false
    
    const [posts, setPosts] = useState(() => generateMorePosts(1, 4));
    const [search, setSearch] = useState("")
    const navigation = useNavigation()
    
    // Check discover mode when screen comes into focus
    useFocusEffect(useCallback(() => {
        console.log('Search screen focus effect triggered');
        
        // Check if discover mode should be shown
        if (getDiscoverMode()) {
            console.log('Setting discover to true from global variable');
            setDiscover(true)
            // Reset the global variable after using it
            resetDiscoverMode()
        } else {
            console.log('Setting discover to false - no discover mode set');
            setDiscover(false)
        }
    }, []))
    // Show search results when typing, show default content when empty
    const showSearchResults = search.trim().length > 0
    
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

    const popularPosts = [
        {
            id: 5,
            avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
            username: "johnnydoe",
            time: "4d",
            org: "youth4change",
            orgUrl: "/profile",
            text: `Just wrapped up an amazing youth leadership workshop! So proud of everyone who participated.`,
            imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
            likes: 15,
            comments: 4,
            shares: 2,
        },
        {
            id: 6,
            avatarUrl: "https://randomuser.me/api/portraits/women/55.jpg",
            username: "sarahsmiles",
            time: "5d",
            org: "cleanwaternow",
            orgUrl: "/profile",
            text: `We distributed clean water kits to over 100 families this week. Thank you to all our volunteers! 💧`,
            imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
            likes: 22,
            comments: 5,
            shares: 6,
        },
        {
            id: 7,
            avatarUrl: "https://randomuser.me/api/portraits/men/54.jpg",
            username: "mikegreen",
            time: "6d",
            org: "treeplanters",
            orgUrl: "/profile",
            text: `Planted 200 trees this weekend! Let's keep making our city greener. 🌳`,
            imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80", 
            likes: 30,
            comments: 7,
            shares: 10,
        },
        {
            id: 8,
            avatarUrl: "https://randomuser.me/api/portraits/women/60.jpg",
            username: "emilywrites",
            time: "1w",
            org: "literacyforall",
            orgUrl: "/profile",
            text: `Hosted a book drive for local schools. Thank you to everyone who donated books! 📚`,
            imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80",
            likes: 18,
            comments: 2,
            shares: 3,
        }
    ]

    const suggestedCauses = [
        {
            name: "Animal Rescue",
            description: "Support local animal shelters and rescue organizations.",
            type: "Nonprofit",
            image: require('../assets/ngo/aspca.jpg'),
        },
        {
            name: "Environmental Conservation",
            description: "Join efforts to protect and restore our natural environment.",
            type: "Nonprofit",
            image: require('../assets/ngo/CRI.jpg'),
        },
        {
            name: "Education",
            description: "Promote literacy and access to quality education for all.",
            type: "Nonprofit",
            image: require('../assets/ngo/paws.jpeg'),
        },
        {
            name: "Healthcare",
            description: "Support local healthcare initiatives and access to medical care.",
            type: "Nonprofit",
            image: require('../assets/ngo/redCross.png'),
        },
    ];

    // Categories for discover mode
    // const discoverCategories = [
    //     { name: "All", text: "#000000", background: "#f5f5f5" },
    //     { name: "Animal Welfare", text: "#E36414", background: "#FFE9DC" },
    //     { name: "Arts", text: "#FF6B6B", background: "#FFECEC" },
    //     { name: "Community", text: "#06D6A0", background: "#D6FAF0" },
    //     { name: "Education", text: "#FFB84D", background: "#FFF3E0" },
    //     { name: "Environment", text: "#6A994E", background: "#E8F4E4" },
    //     { name: "Food Insecurity", text: "#FF9F1C", background: "#FFF0D9" },
    //     { name: "General", text: "#ADB5BD", background: "#F3F4F6" },
    //     { name: "Global", text: "#48CAE4", background: "#D7F0FB" },
    //     { name: "Healthcare", text: "#D62828", background: "#FFE5E5" },
    //     { name: "Housing", text: "#8D6E63", background: "#F5E9E3" },
    //     { name: "Jobs", text: "#6C757D", background: "#ECEFF1" },
    //     { name: "Legal", text: "#FFBE0B", background: "#FFF7D6" },
    //     { name: "Membership", text: "#5E6472", background: "#EBEDF1" },
    //     { name: "Mental", text: "#9D4EDD", background: "#F3E8FA" },
    //     { name: "Philanthropy", text: "#FF006E", background: "#FFE0ED" },
    //     { name: "Public", text: "#2A9D8F", background: "#D6F4F1" },
    //     { name: "Relief", text: "#F94144", background: "#FFE3E3" },
    //     { name: "Religion", text: "#E9C46A", background: "#FFF7E0" },
    //     { name: "Research", text: "#3A86FF", background: "#DDE8FF" },
    //     { name: "Rights", text: "#780000", background: "#FFDADA" },
    //     { name: "Science", text: "#023E8A", background: "#D7E3FF" },
    //     { name: "Services", text: "#3F37C9", background: "#E2E0FA" },
    //     { name: "Society", text: "#577590", background: "#EAF0F5" },
    //     { name: "Sports", text: "#90BE6D", background: "#EBF6E2" },
    //     { name: "Wellness", text: "#F28482", background: "#FFEAEA" },
    //     { name: "Youth", text: "#4CC9F0", background: "#E0F7FF" },
    // ];

    const discoverCategories = [
        { name: "All", text: "#000000", background: "#f5f5f5" },
        { name: "Animals", text: "#E36414", background: "#FFE9DC" },
        { name: "Arts", text: "#FF6B6B", background: "#FFECEC" },
        { name: "Community", text: "#06D6A0", background: "#D6FAF0" },
        { name: "Education", text: "#FFB84D", background: "#FFF3E0" },
        { name: "Environment", text: "#6A994E", background: "#E8F4E4" },
        { name: "Food", text: "#FF9F1C", background: "#FFF0D9" },
        { name: "General", text: "#ADB5BD", background: "#F3F4F6" },
        { name: "Global", text: "#48CAE4", background: "#D7F0FB" },
        { name: "Health", text: "#D62828", background: "#FFE5E5" },
        { name: "Housing", text: "#8D6E63", background: "#F5E9E3" },
        { name: "Jobs", text: "#6C757D", background: "#ECEFF1" },
        { name: "Legal", text: "#FFBE0B", background: "#FFF7D6" },
        { name: "Membership", text: "#5E6472", background: "#EBEDF1" },
        { name: "Mental", text: "#9D4EDD", background: "#F3E8FA" },
        { name: "Philanthropy", text: "#FF006E", background: "#FFE0ED" },
        { name: "Public", text: "#2A9D8F", background: "#D6F4F1" },
        { name: "Relief", text: "#F94144", background: "#FFE3E3" },
        { name: "Religion", text: "#E9C46A", background: "#FFF7E0" },
        { name: "Research", text: "#3A86FF", background: "#DDE8FF" },
        { name: "Rights", text: "#780000", background: "#FFDADA" },
        { name: "Science", text: "#023E8A", background: "#D7E3FF" },
        { name: "Services", text: "#3F37C9", background: "#E2E0FA" },
        { name: "Society", text: "#577590", background: "#EAF0F5" },
        { name: "Sports", text: "#90BE6D", background: "#EBF6E2" },
        { name: "Wellness", text: "#F28482", background: "#FFEAEA" },
        { name: "Youth", text: "#4CC9F0", background: "#E0F7FF" },
      ];

    const [selectedCategory, setSelectedCategory] = useState("All");

    // If in discover mode, show discover-focused layout
    if (discover) {
        return (
            <SafeAreaView style={{ backgroundColor: '#f9fafb', flex: 1 }} edges={['top', 'left', 'right']}>
                <MainHeaderNav  />
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
                            <TouchableOpacity 
                                style={{ 
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
                                }}
                                onPress={() => setDiscover(false)}
                            >
                                <Search size={20} color={PrimaryGrey} style={{ marginRight: 12 }} />
                                <Text style={{ 
                                    flex: 1, 
                                    fontSize: 16, 
                                    color: '#9ca3af' 
                                }}>
                                    Search for nonprofits or causes...
                                </Text>
                            </TouchableOpacity>
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
                                {discoverCategories.map((category) => (
                                    <TouchableOpacity
                                        key={category.name}
                                        style={{
                                            backgroundColor: selectedCategory === category.name 
                                                ? category.text 
                                                : category.background,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: '#E5E7EB',
                                        }}
                                        onPress={() => setSelectedCategory(selectedCategory === category.name ? "All" : category.name)}
                                    >
                                        <Text style={{ 
                                            fontSize: 14, 
                                            color: selectedCategory === category.name 
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
            <MainHeaderNav />
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
                        clearButtonMode="while-editing"
                        style={{ flex: 1 }}
                    />
                </View>
                
                {/* Search Results - Show when typing */}
                {showSearchResults && (
                    <>

                        <TouchableOpacity onPress={() => navigation.navigate('Interests' as never)} style={{
                            backgroundColor: "#FFE9DC",
                            paddingHorizontal: 13,
                            paddingVertical: 12,
                            borderRadius: 10,
                            marginTop: 15,
                            marginBottom: 15,
                            alignSelf: 'flex-start',
                            maxWidth: '90%'
                          }}>
                            <Text style={{ fontSize: 13, color: '#E36414', fontWeight: '500' }}>Animals</Text>
                          </TouchableOpacity>

                        <NearbyCauses />
                        
<PopularPosts
                    posts={posts}
                    related
                    hasMore={false}
                />
                      
                    </>
                )}

                {/* Default Content - Show when not searching */}
                {!showSearchResults && (
                    <>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Clock size={20} color={PrimaryGrey} />
                            <Text style={{ fontSize: 16, fontWeight: '600', marginLeft: 8, color: PrimaryGrey }}>Recent Searches</Text>
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
                                            backgroundColor: LightGrey, 
                                            borderRadius: 20, 
                                            marginRight: 12 
                                        }}>
                                            <Clock size={16} color={PrimaryGrey} />
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
                                        <X size={16} color={PrimaryGrey} />
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
                            <TrendingUp size={20} color={PrimaryGrey} />
                            <Text style={{ fontSize: 16, fontWeight: '600', marginLeft: 8, color: PrimaryGrey }}>Popular Searches</Text>
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
                                            backgroundColor: LightGrey, 
                                            borderRadius: 20, 
                                            marginRight: 12 
                                        }}>
                                            <TrendingUp size={16} color={PrimaryGrey} />
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
                                        <X size={16} color={PrimaryGrey} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}