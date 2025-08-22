import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryBlue } from '../Constants/Colors'
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
    // Sample data for categories
    const categories = [
        "Animal Welfare",
        "Environment",
        "Food Insecurity",
        "Food Insecurity",
        "Environment",
        "Education",
        "Healthcare",
        "Social Justice",
        "Homelessness",
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

                {/* main message */}
                <View style={{ 
                    backgroundColor: SecondaryBlue, 
                    padding: 20, 
                    borderRadius: 16, 
                    alignItems: 'center', 
                    marginTop: 15,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <Text style={{ 
                        fontSize: 20, 
                        fontWeight: '800', 
                        textAlign: 'center', 
                        color: PrimaryBlue,
                        marginBottom: 8,
                        lineHeight: 26,
                    }}
                    >
                    THE EASIEST WAY TO GIVE TO EVERYTHING YOU CARE ABOUT, AT ONCE.                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Donation' as never)} 
                        style={{ 
                            backgroundColor: '#000', 
                            paddingVertical: 12, 
                            paddingHorizontal: 24, 
                            borderRadius: 25, 
                            marginTop: 15,
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

                {/* causes carousel */}
                <CausesCarousel />


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

                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Explore Categories</Text>
                <FlatList 
                    data={categories}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item,index }) => (
                        <View key={index} style={{
                            backgroundColor: LightGrey,
                            paddingHorizontal: 13,
                            paddingVertical: 12,
                            borderRadius: 10,
                            marginTop:15,
                            marginLeft:10
                          }}>
                            <Text style={{ fontSize: 13, color: '#000',fontWeight:'500' }}>{item}</Text>
                          </View>
                    )}
                />

                <SuggestdCauses />

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