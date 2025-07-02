import { View, Text, TextInput, FlatList, ScrollView } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryGrey } from '../Constants/Colors'
import { Search } from 'lucide-react-native'
import TopicList from '../components/TopicList'
import SuggestedCrwd from '../components/SuggestedCrwd'
import SuggestdCauses from '../components/SuggestdCauses'
import NearbyCauses from '../components/NearbyCauses'
import PopularPosts from '../components/PopularPosts'

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
        <View style={{backgroundColor: 'white', flex: 1}}>
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
                        placeholder='Search' 
                        clearButtonMode="while-editing"
                        style={{ flex: 1 }}
                    />
                </View>

                <TopicList />

                <SuggestedCrwd />

                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Categories</Text>
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
        </View>
    )
}