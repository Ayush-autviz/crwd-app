import { View, Text, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'

// Sample data generator for profile posts
const generateMoreProfilePosts = (startId: number, count: number) => {
    const organizations = ["marchofdimes", "feedthehungry", "greenearth", "animalrescue"];
    const messages = [
        "Just finished another amazing volunteer session! Making a real difference in our community. 💪",
        "Grateful to be part of such an impactful initiative. Every small action counts! 🙏",
        "Working together to create positive change. Join us in our next event! 🌟",
        "Thank you to everyone who participated today. Your support means everything! ❤️",
        "Another successful community event completed. The smiles make it all worth it! 😊"
    ];
    const images = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1464983953574-0892a716854b",
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d",
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b",
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c"
    ];

    return Array.from({ length: count }, (_, index) => ({
        id: String(startId + index),
        avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg", // Keep same avatar for profile
        username: "mynameismya", // Keep same username for profile
        time: `${Math.floor(Math.random() * 7)}d`,
        org: organizations[Math.floor(Math.random() * organizations.length)],
        text: messages[Math.floor(Math.random() * messages.length)],
        imageUrl: Math.random() > 0.5 ? `${images[Math.floor(Math.random() * images.length)]}?auto=format&fit=crop&w=600&q=80` : undefined,
        likes: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 5),
        shares: Math.floor(Math.random() * 3),
    }));
};

export default function Profile() {
    const [profilePosts, setProfilePosts] = useState(() => generateMoreProfilePosts(1, 4));
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newPosts = generateMoreProfilePosts(profilePosts.length + 1, 4);
        setProfilePosts(prevPosts => [...prevPosts, ...newPosts]);
        setIsLoadingMore(false);
    };

    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
            <MainHeaderNav />
            <ScrollView style={{paddingHorizontal: 20}}>
                <ProfileBio />
                <ProfileStats />
                <PopularPosts 
                    posts={profilePosts} 
                    showTitle={false}
                    onLoadMore={handleLoadMore}
                    hasMore={true}
                />
            </ScrollView>
        </SafeAreaView>
    )
}