import { View, Text, ScrollView, TouchableOpacity, Share, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import { Share2 } from 'lucide-react-native'
import { PrimaryBlue } from '../Constants/Colors'
import { useToast } from '../contexts/ToastContext'
import { Upload } from 'lucide-react-native'

// Sample data generator for profile posts
const generateMoreProfilePosts = (startId: number, count: number, imageUrl: string, username: string) => {
    const organizations = ["marchofdimes", "feedthehungry", "greenearth", "animalrescue"];
    const messages = [
        "Just finished another amazing volunteer session! Making a real difference in our community. 💪",
        "Grateful to be part of such an impactful initiative. Every small action counts! 🙏",
        "Working together to create positive change. Join us in our next event! 🌟",
        "Thank you to everyone who participated today. Your support means everything! ❤️",
        "Another successful community event completed. The smiles make it all worth it! 😊"
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: (startId + i).toString(),
        username: username,
        avatarUrl: imageUrl,
        time: `${Math.floor(Math.random() * 23) + 1}h`,
        org: organizations[Math.floor(Math.random() * organizations.length)],
        text: messages[Math.floor(Math.random() * messages.length)],
        imageUrl: Math.random() > 0.5 ? `https://picsum.photos/500/300?random=${startId + i}` : undefined,
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10)
    }));
};

export default function UserProfile({route}: {route: any}) {
    const { imageUrl, username } = route.params;
    const [profilePosts, setProfilePosts] = useState(() => generateMoreProfilePosts(1, 4, imageUrl, username));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const { showToast } = useToast();

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newPosts = generateMoreProfilePosts(profilePosts.length + 1, 4, imageUrl, username);
        setProfilePosts(prevPosts => [...prevPosts, ...newPosts]);
        setIsLoadingMore(false);
    };

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Check out ${username}'s profile!`,
                title: `${username}'s Profile`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
    };

    const handleFollowClick = () => {
        setIsFollowing(!isFollowing);
        showToast(isFollowing ? `Unfollowed ${username}` : `Following ${username}`);
    };

    return (
        <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
            <MainHeaderNav show={true} menu={false} title={'Profile'}/>
            <ScrollView style={{flex: 1}}>
                {/* Top right buttons */}
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 20, paddingTop: 16}}>
                    <TouchableOpacity 
                        onPress={handleShare}
                        style={{
                            height: 32,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: 'white',
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Upload size={16} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleFollowClick}
                        style={{
                            height: 32,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: isFollowing ? 'white' : PrimaryBlue,
                            borderWidth: isFollowing ? 1 : 0,
                            borderColor: '#e5e7eb',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: isFollowing ? '#374151' : 'white'
                        }}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{paddingHorizontal: 20}}>
                    <ProfileBio imageUrl={imageUrl} username={username} isOwnProfile={false} />
                    <ProfileStats />
                    <PopularPosts 
                        posts={profilePosts} 
                        showTitle={false}
                        onLoadMore={handleLoadMore}
                        hasMore={true}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}