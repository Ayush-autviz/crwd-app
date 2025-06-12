import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'
import SuggestdCauses from '../components/SuggestdCauses'
import PopularPosts from '../components/PopularPosts'

export default function Search2() {
    const [search, setSearch] = useState("")
    const navigation = useNavigation()

    const suggestedCauses = [
        {
            name: "The Red Cross",
            type: "Cause",
            description: "An health organization that...",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=600&q=80",
        },
        {
            name: "St. Judes",
            type: "CRWD",
            description: "The leading children's hea...",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80",
        },
        {
            name: "Women's Healthcare of At...",
            type: "Cause",
            description: "We are Atlanta's #1 healthca...",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=600&q=80",
        },
    ]

    const popularPosts = [
        {
            id: 1,
            avatarUrl: "https://randomuser.me/api/portraits/women/30.jpg",
            username: "mynameismya",
            time: "17h",
            org: "feedthehungry",
            orgUrl: "/profile",
            text: `The quick, brown fox jumps over a lazy dog. DJs flock by animal welfare quiz prog. Junk MTV quiz graced by fox whelps.`,
            imageUrl: null,
            likes: 258,
            comments: 15,
            shares: 3,
        },
        {
            id: 2,
            avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
            username: "johnsmith",
            time: "1d",
            org: "animalwelfare",
            orgUrl: "/profile",
            text: `The quick, brown fox jumps over a lazy dog. DJs flock by animal welfare quiz prog. Junk`,
            imageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=600&q=80",
            likes: 1000,
            comments: 170,
            shares: 25,
        },
    ]

    const categories = [
        "Animal Welfare",
        "Environment", 
        "Food Insecurity",
        "Education",
        "Healthcare",
        "Social Justice",
        "Homelessness",
    ]

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
            <MainHeaderNav show={true} />
            <ScrollView style={{ paddingHorizontal: 20 }}>
                {/* Search Bar */}
                <View style={{ marginVertical: 10, padding: 10, backgroundColor: LightGrey, borderRadius: 8 }}>
                    <TextInput 
                        placeholder='Search for non-profits, CRWDs, or posts' 
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filter Chip */}
                {/* <View style={{ padding: 10, marginBottom: 10, backgroundColor: LightGrey, alignSelf: 'flex-start', borderRadius: 8 }}>
                    <Text>Animal Welfare</Text>
                </View> */}

                {/* No Results Found Block */}


                <SuggestdCauses />
                <PopularPosts posts={popularPosts}/>

                {/* Suggested Causes Section */}
                {/* <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: PrimaryGrey }}>Suggested Causes</Text>
                    {suggestedCauses.map((cause, index) => (
                        <TouchableOpacity 
                            key={index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'white',
                                padding: 15,
                                marginBottom: 10,
                                borderRadius: 10,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                            onPress={() => {
                                if (cause.type === "Cause") {
                                    navigation.navigate('CauseScreen' as never)
                                } else {
                                    navigation.navigate('GroupCRWD' as never)
                                }
                            }}
                        >
                            <Image 
                                source={{ uri: cause.image }}
                                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{cause.name}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey, marginBottom: 2 }}>{cause.type}</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{cause.description}</Text>
                            </View>
                            <TouchableOpacity 
                                style={{
                                    backgroundColor: PrimaryBlue,
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Visit</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                    
                    <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 }}>
                        <Text style={{ color: PrimaryBlue, fontSize: 14 }}>Discover More →</Text>
                    </TouchableOpacity>
                </View>

                {/* Popular Posts Section */}
                {/* <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: PrimaryGrey }}>Popular Posts</Text>
                    {popularPosts.map((post, index) => (
                        <TouchableOpacity 
                            key={post.id}
                            style={{
                                backgroundColor: 'white',
                                padding: 15,
                                marginBottom: 15,
                                borderRadius: 10,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                            onPress={() => navigation.navigate('PostDetail' as never)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Image 
                                    source={{ uri: post.avatarUrl }}
                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600' }}>{post.username}</Text>
                                    <Text style={{ fontSize: 12, color: PrimaryGrey }}>{post.org} • {post.time}</Text>
                                </View>
                            </View>
                            
                            <Text style={{ fontSize: 14, marginBottom: 10, lineHeight: 20 }}>{post.text}</Text>
                            
                            {post.imageUrl && (
                                <Image 
                                    source={{ uri: post.imageUrl }}
                                    style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 10 }}
                                />
                            )}
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{post.likes} likes</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{post.comments} comments</Text>
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{post.shares} shares</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View> */}

                {/* Popular Categories */}
                {/* <View style={{ marginTop: 20, marginBottom: 30 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: PrimaryGrey }}>Popular Categories</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {categories.map((category, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={{
                                    backgroundColor: LightGrey,
                                    paddingHorizontal: 15,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    marginBottom: 5,
                                }}
                                onPress={() => navigation.navigate('SearchScreen' as never)}
                            >
                                <Text style={{ fontSize: 12, color: PrimaryGrey }}>{category}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>  */}
            </ScrollView>
        </SafeAreaView>
    )
} 