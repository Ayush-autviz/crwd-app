import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { Ellipsis, Heart, MessageCircle } from 'lucide-react-native';

export default function PopularPosts({posts, showTitle = true }) {

    const screenWidth = Dimensions.get('window').width;

   

    return (
        <View style={{marginTop: 20, marginBottom: 50 }}>
            {showTitle && <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Popular Posts</Text>}
            <FlatList
                data={posts}
                renderItem={({ item }) => (
                    <View style={styles.container}>
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.username}</Text>
                                    <Text style={{ fontSize: 14, color: PrimaryGrey }}>.</Text>
                                    <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.time}</Text>
                                </View>
                                <TouchableOpacity>
                                    <Ellipsis size={18} color={PrimaryGrey} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: PrimaryBlue, marginTop: 5 }}>{item.org}</Text>
                            <Text ellipsizeMode='tail' style={{ fontSize: 14, fontWeight: 400, flexWrap: 'wrap', width: screenWidth - 120, marginTop: 5 }} numberOfLines={3}>{item.text}</Text>
                            { item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: screenWidth - 120, height: 150, borderRadius: 10, marginTop: 10 }} />}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: screenWidth - 120, gap: 10, marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Heart size={18} color={PrimaryGrey} />
                                        <Text style={{ color: PrimaryGrey }}>{item.likes}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <MessageCircle size={18} color={PrimaryGrey} />
                                        <Text style={{ color: '#808080' }}>{item.comments}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/icons/forward.png')} style={{ width: 18, height: 18 }} />
                                    <Text style={{ color: PrimaryGrey }}>{item.shares}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        flexDirection: 'row',
        backgroundColor: 'white',
        gap: 10,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,   // no left/right shadow
            height: 1,  // more shadow downward
        },
        shadowOpacity: 0.1, // subtle transparency
        shadowRadius: 6,
        elevation: 3, // for Android
        borderRadius: 10,
        padding: 12,
    }
})