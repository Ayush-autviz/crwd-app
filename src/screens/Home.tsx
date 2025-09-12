import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity } from 'react-native'
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

export default function Home() {
    const [posts, setPosts] = useState(() => generateMorePosts(1, 4));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const navigation = useNavigation();
    // Sample data for categories with colors
    // const categories = [
    //     {
    //         name: "Animal Welfare",
    //         text: "#E36414",      // Orange-Red
    //         background: "#FFE1CC", // Softer warm orange tint
    //     },
    //     {
    //         name: "Environment",
    //         text: "#6A994E",      // Olive Green
    //         background: "#DFF0D6", // Fresh leafy green tint
    //     },
    //     {
    //         name: "Food Insecurity",
    //         text: "#FF9F1C",      // Carrot Orange
    //         background: "#FFE6CC", // Light orange tint (not too pale)
    //     },
    //     {
    //         name: "Education",
    //         text: "#FFB84D",      // Amber
    //         background: "#FFEFD1", // Gentle amber tint
    //     },
    //     {
    //         name: "Healthcare",
    //         text: "#D62828",      // Crimson
    //         background: "#FFD6D6", // Soft rosy red tint
    //     },
    //     {
    //         name: "Social Justice",
    //         text: "#780000",      // Maroon
    //         background: "#F2C7C7", // Muted pinkish tint
    //     },
    //     {
    //         name: "Homelessness",
    //         text: "#8D6E63",      // Brown
    //         background: "#EADFD9", // Warm earthy beige tint
    //     },
    // ];

    const categories = [
        {
          name: "Animals",
          text: "#E36414", // Orange-Red
          background: "#FFE1CC", // Softer warm orange tint
        },
        {
          name: "Environment",
          text: "#6A994E", // Olive Green
          background: "#DFF0D6", // Fresh leafy green tint
        },
        {
          name: "Food",
          text: "#FF9F1C", // Carrot Orange
          background: "#FFE6CC", // Light orange tint (not too pale)
        },
        {
          name: "Education",
          text: "#FFB84D", // Amber
          background: "#FFEFD1", // Gentle amber tint
        },
        {
          name: "Health",
          text: "#D62828", // Crimson
          background: "#FFD6D6", // Soft rosy red tint
        },
        {
          name: "Rights",
          text: "#780000", // Maroon
          background: "#F2C7C7", // Muted pinkish tint
        },
        {
          name: "Housing",
          text: "#8D6E63", // Brown
          background: "#EADFD9", // Warm earthy beige tint
        },
      ];

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newPosts = generateMorePosts(posts.length + 1, 4);
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        setIsLoadingMore(false);
    };

    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}} edges={['top', 'left', 'right']}>
            <HomeHeader />
            <ScrollView style={{ paddingHorizontal: 20 }}>

                {/* Main Message */}
                <View style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: 24, 
                    borderRadius: 20, 
                    alignItems: 'center', 
                    marginTop: 15,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: '#e9ecef'
                }}>
                    <Text style={{ 
                        fontSize: 20, 
                        fontWeight: '800', 
                        textAlign: 'center', 
                        color: '#495057',
                        marginBottom: 10,
                        lineHeight: 26,
                    }}
                    >
                        THE EASIEST WAY TO <Text style={{ color: PrimaryGreen }}>GIVE</Text> TO EVERYTHING YOU CARE ABOUT, AT ONCE.
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Donation' as never)} 
                        style={{ 
                            backgroundColor: PrimaryBlue, 
                            paddingVertical: 12, 
                            paddingHorizontal: 20, 
                            borderRadius: 25, 
                        }}
                    >
                        <Text style={{ 
                                fontSize: 16, 
                            color: 'white', 
                            fontWeight: '600',
                            textAlign: 'center',
                        }}>
                            Start Giving
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

                <SuggestedCrwd />

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
                                    onPress={() => navigation.navigate('Interests' as never)} 
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
                            onPress={() => {
                                setDiscoverMode(true);
                                navigation.navigate('Search' as never);
                            }}
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

                <SuggestdCauses />

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

                <NearbyCauses />

                <PopularPosts
                    posts={posts}
                    onLoadMore={handleLoadMore}
                    hasMore={true}
                />

            </ScrollView>
        </SafeAreaView>
    )
}