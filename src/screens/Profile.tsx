import { View, Text, ScrollView, TouchableOpacity, Share, Alert, Image, Modal, TouchableWithoutFeedback } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'
import ProfileInterests from '../components/ProfileInterests'
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { Share2, Flag, ChevronRight } from 'lucide-react-native'

type RootStackParamList = {
    ProfileEdit: undefined;
    Interests: undefined;
    Search: undefined;
};

// Sample data for recently supported organizations
const orgAvatars = [
    {
        name: "ASPCA",
        image: require('../assets/images/redcross.png'),
    },
    {
        name: "CRI",
        image: require('../assets/images/grocery.jpg'),
    },
    {
        name: "CureSearch",
        image: require('../assets/images/redcross.png'),
    },
    {
        name: "Paws",
        image: require('../assets/images/grocery.jpg'),
    },
];

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

    return Array.from({ length: count }, (_, i) => ({
        id: (startId + i).toString(),
        username: "mynameismya",
        avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        time: `${Math.floor(Math.random() * 23) + 1}h`,
        org: organizations[Math.floor(Math.random() * organizations.length)],
        text: messages[Math.floor(Math.random() * messages.length)],
        imageUrl: Math.random() > 0.5 ? `https://picsum.photos/500/300?random=${startId + i}` : undefined,
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10)
    }));
};

// Sample interests data
const interests = ['Environment', 'Food Insecurity', 'Education', 'Healthcare'];

export default function Profile() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [profilePosts, setProfilePosts] = useState(() => generateMoreProfilePosts(1, 4));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newPosts = generateMoreProfilePosts(profilePosts.length + 1, 4);
        setProfilePosts(prevPosts => [...prevPosts, ...newPosts]);
        setIsLoadingMore(false);
    };

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Check out my profile!`,
                title: `My Profile`,
            });
            
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
        finally {
            setShowMenu(false);
        }
    };

    const handleReportProfile = () => {
        Alert.alert('Report Profile', 'Report functionality would go here');
        setShowMenu(false);
    };

    const handleFollow = () => {
        Alert.alert('Follow', 'Follow functionality would go here');
    };

    const handleMoreInterests = () => {
        navigation.navigate('Interests' as never);
    };

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }} edges={['top', 'left', 'right']}>
            <MainHeaderNav />

            {/* Top right buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        onPress={() => setShowMenu(!showMenu)}
                        style={{
                            padding: 8,
                            borderRadius: 20,
                        }}
                    >
                        <Text style={{ fontSize: 24, color: '#374151' }}>⋯</Text>
                    </TouchableOpacity>

                    {showMenu && (
                        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                            <View style={{
                                position: 'absolute',
                                right: 0,
                                top: 40,
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                borderRadius: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 5,
                                width: 144,
                                zIndex: 20,
                            }}>
                                <TouchableWithoutFeedback onPress={() => {}}>
                                    <View>
                                        <TouchableOpacity
                                            onPress={handleShare}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f3f4f6',
                                            }}
                                        >
                                            <Share2 size={16} color="#374151" />
                                            <Text style={{ fontSize: 14, color: '#374151' }}>Share Profile</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleReportProfile}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                            }}
                                        >
                                            <Flag size={16} color="#ef4444" />
                                            <Text style={{ fontSize: 14, color: '#ef4444' }}>Report Profile</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </View>
                <TouchableOpacity
                    onPress={handleFollow}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: PrimaryBlue,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: 'white'
                    }}>
                        Follow
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20 }}>
                    {/* Profile Header */}
                    <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
                        {/* Avatar */}
                        <TouchableOpacity onPress={() => setShowImageModal(true)}>
                            <Image
                                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    marginBottom: 16
                                }}
                            />
                        </TouchableOpacity>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: 16
                        }}>
                            My Name is Mya
                        </Text>

                        {/* Location and Link */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, color: '#6b7280' }}>📍</Text>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Atlanta, GA</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={{ fontSize: 12, color: PrimaryBlue, textDecorationLine: 'underline' }}>
                                    thisisaurl.com
                                </Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>Active since 2023</Text>
                        </View>
                    </View>

                    {/* Profile Stats */}
                    <ProfileStats />

                    {/* Recently Supported Section */}
                    <View style={{ marginTop: 24, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                                Recently Supported
                            </Text>
                            <TouchableOpacity onPress={handleMoreInterests}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline' }}>
                                        More
                                    </Text>
                                    <ChevronRight size={16} color={PrimaryBlue} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Organization Avatars */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            {orgAvatars.map((org, index) => (
                                <TouchableOpacity onPress={() => navigation.navigate('CauseScreen' as never)} key={index} style={{ alignItems: 'center' }}>
                                    <Image
                                        source={org.image}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 8,
                                            marginBottom: 4
                                        }}
                                    />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
                                        {org.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Profile Bio */}
                    {/* <ProfileBio 
                        imageUrl="https://randomuser.me/api/portraits/women/44.jpg"
                        username="mynameismya"
                        isOwnProfile={true}
                    /> */}


                    <Text style={{
                        fontSize: 14,
                        color: PrimaryGrey,
                        marginVertical: 8,
                        lineHeight: 20
                    }}>
                        This is a bio about mynameismya and how they like to help others and give back to their community. They also love ice cream.
                    </Text>

                    {/* Recent Activity */}
                    <View style={{ paddingVertical: 16 }}>
                        {/* <Text style={{fontSize: 18, fontWeight: '600', color: '#111827'}}>
                            Recent Activity
                        </Text> */}
                        <PopularPosts
                            posts={profilePosts}
                            title="Recent Activity"
                            onLoadMore={handleLoadMore}
                            hasMore={true}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Image View Modal */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        // opacity: 0.9,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View>
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        top: 50,
                                        right: 20,
                                        zIndex: 1
                                    }}
                                    onPress={() => setShowImageModal(false)}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
                                    </View>
                                </TouchableOpacity>
                                
                                <TouchableOpacity onPress={() => setShowImageModal(false)}>
                                    <Image
                                        source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                                        style={{
                                            width: 300,
                                            height: 300,
                                            borderRadius: 150,
                                            resizeMode: 'cover'
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    )
}