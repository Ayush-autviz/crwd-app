import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React from 'react'

export default function TopicList({ showTitle = true }) {

    // Static array of avatar image URLs
    const avatarImages = [
        "https://randomuser.me/api/portraits/men/33.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/34.jpg",
        "https://randomuser.me/api/portraits/women/45.jpg",
        "https://randomuser.me/api/portraits/men/35.jpg",
        "https://randomuser.me/api/portraits/women/46.jpg",
        "https://randomuser.me/api/portraits/men/36.jpg",
        "https://randomuser.me/api/portraits/women/47.jpg",
        "https://randomuser.me/api/portraits/men/37.jpg",
        "https://randomuser.me/api/portraits/women/48.jpg",
    ];

    const topic: any = [
        {
            id: "1",
            name: "NFT Funding",
            posts: 34,
            avatars: ["1", "2", "3"],
        },
        {
            id: "2",
            name: "Harvard",
            posts: 126,
            avatars: ["4", "5", "6", "7"],
        },
        {
            id: "3",
            name: "#givingtuesday",
            posts: 156,
            avatars: ["8", "9", "10",],
        },
        // {
        //     id: "4",
        //     name: "National Parks",
        //     posts: 176,
        //     avatars: ["1", "3", "4"],
        // },
        // {
        //     id: "5",
        //     name: "Columbia",
        //     posts: 76,
        //     avatars: ["5", "6", "1", "8"],
        // },
    ];

    return (
        <View style={{ marginTop: 20 }}>
            {showTitle && <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Topics</Text>}
            <View>
                <FlatList data={topic}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                            {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {item.avatars.map((avatar: any, index: number) => (
                                            <Image
                                                key={index}
                                                source={{ uri: avatarImages[avatar - 1] }}
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 15,
                                                    borderWidth: 2,
                                                    borderColor: 'white',
                                                    marginLeft: index > 0 ? -8 : 0, // Create overlap with negative margin
                                                }}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View> */}
                            <Text>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    )
}