import { View, Text, FlatList, Image, Dimensions, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native'
import React, { useState } from 'react'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { Ellipsis, Heart, MessageCircle, Flag, Trash2 } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'

export default function PopularPosts({posts, showTitle = true}) {
    const navigation = useNavigation()
    const screenWidth = Dimensions.get('window').width
    const [tooltipVisible, setTooltipVisible] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const [selectedPost, setSelectedPost] = useState(null)

    const handlePostPress = (post) => {
        navigation.navigate('PostDetail', { post })
    }

    const handleEllipsisPress = (event, post) => {
        const { pageX, pageY } = event.nativeEvent
        setTooltipPosition({ x: pageX-50, y: pageY+30 })
        setSelectedPost(post)
        setTooltipVisible(true)
    }

    return (
        <View style={{marginTop: 20, marginBottom: 50}}>
            {showTitle && <Text style={{fontSize: 18, fontWeight: 'bold'}}>Popular Posts</Text>}
            <FlatList
                data={posts}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.container}
                        onPress={() => handlePostPress(item)}
                    >
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.username}</Text>
                                    <Text style={{ fontSize: 14, color: PrimaryGrey }}>.</Text>
                                    <Text style={{ fontSize: 12, color: PrimaryGrey }}>{item.time}</Text>
                                </View>
                                <TouchableOpacity onPress={(event) => handleEllipsisPress(event, item)}>
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
                    </TouchableOpacity>
                )}
            />

            <Modal
                transparent={true}
                visible={tooltipVisible}
                onRequestClose={() => setTooltipVisible(false)}
            >
                <Pressable 
                    style={StyleSheet.absoluteFill} 
                    onPress={() => setTooltipVisible(false)}
                >
                    <View style={[
                        styles.tooltip, 
                        {
                            position: 'absolute',
                            left: tooltipPosition.x - 100,
                            top: tooltipPosition.y - 20,
                        }
                    ]}>
                        <TouchableOpacity 
                            style={styles.tooltipItem}
                            onPress={() => {
                                // Handle delete post
                                setTooltipVisible(false)
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Trash2 size={16} color="#ef4444" />
                                <Text style={[styles.tooltipText, { color: '#ef4444' }]}>Delete Post</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.tooltipItem}
                            onPress={() => {
                                // Handle report post
                                setTooltipVisible(false)
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Flag size={16} color={PrimaryGrey} />
                                <Text style={styles.tooltipText}>Report Post</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 16,
        gap:10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5'
    },
    tooltip: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: 160,
    },
    tooltipItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tooltipText: {
        fontSize: 14,
        color: '#111',
    }
})