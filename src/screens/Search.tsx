import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import SuggestdCauses from '../components/SuggestdCauses'
import PopularPosts from '../components/PopularPosts'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'
import { Clock, TrendingUp, X, Search } from 'lucide-react-native'
import NearbyCauses from '../components/NearbyCauses'


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
    const [posts, setPosts] = useState(() => generateMorePosts(1, 4));
    const [search, setSearch] = useState("")
    const navigation = useNavigation()
    
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

                        <View style={{
                            backgroundColor: LightGrey,
                            paddingHorizontal: 13,
                            paddingVertical: 12,
                            borderRadius: 10,
                            marginTop: 15,
                            marginBottom: 15,
                            alignSelf: 'flex-start',
                            maxWidth: '90%'
                          }}>
                            <Text style={{ fontSize: 13, color: '#000', fontWeight: '500' }}>Animal Welfare</Text>
                          </View>

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