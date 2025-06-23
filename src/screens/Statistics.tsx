import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'

export default function Statistics() {
    const [activeTab, setActiveTab] = useState<'causes' | 'crwds' | 'followers' | 'following'>('causes')

    const causes = [
        { name: "Red Cross", avatar: "https://randomuser.me/api/portraits/men/32.jpg", impact: "Donated $500" },
        { name: "Food for All", avatar: "https://randomuser.me/api/portraits/women/44.jpg", impact: "Volunteered 20h" },
        { name: "Hope Foundation", avatar: "https://randomuser.me/api/portraits/men/65.jpg", impact: "Shared 10 posts" },
    ]

    const crwds = [
        { name: "Feed the Hungry", avatar: "https://randomuser.me/api/portraits/men/32.jpg", role: "Admin" },
        { name: "Clean Water Project", avatar: "https://randomuser.me/api/portraits/women/28.jpg", role: "Member" },
    ]

    const following = [
        { name: "Jane Doe", username: "janedoe", avatar: "https://randomuser.me/api/portraits/women/32.jpg", connected: true },
        { name: "John Smith", username: "johnsmith", avatar: "https://randomuser.me/api/portraits/men/45.jpg", connected: false },
        { name: "Alice Blue", username: "aliceblue", avatar: "https://randomuser.me/api/portraits/women/55.jpg", connected: false },
    ]

    const followers = [
        { name: "Chris Red", username: "chrisred", avatar: "https://randomuser.me/api/portraits/men/22.jpg", connected: false },
        { name: "Mia Green", username: "miagreen", avatar: "https://randomuser.me/api/portraits/women/23.jpg", connected: false },
        { name: "Sam Yellow", username: "samyellow", avatar: "https://randomuser.me/api/portraits/men/24.jpg", connected: false },
    ]

    const renderCauses = () => (
        <ScrollView>
            {causes.map((cause, index) => (
                <View key={index} style={{ 
                    flexDirection: 'row', 
                    padding: 16,
                    backgroundColor: 'white',
                    marginBottom: 12,
                    borderRadius: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                }}>
                    <Image 
                        source={{ uri: cause.avatar }} 
                        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} 
                    />
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>{cause.name}</Text>
                        <Text style={{ fontSize: 14, color: PrimaryGrey, marginTop: 4 }}>{cause.impact}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    )

    const renderCRWDs = () => (
        <ScrollView>
            {crwds.map((crwd, index) => (
                <View key={index} style={{ 
                    flexDirection: 'row', 
                    padding: 16,
                    backgroundColor: 'white',
                    marginBottom: 12,
                    borderRadius: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image 
                            source={{ uri: crwd.avatar }} 
                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} 
                        />
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>{crwd.name}</Text>
                            <Text style={{ fontSize: 14, color: PrimaryGrey, marginTop: 4 }}>{crwd.role}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={{ 
                            backgroundColor: '#F0F2FB', 
                            paddingHorizontal: 16, 
                            paddingVertical: 8, 
                            borderRadius: 20 
                        }}
                    >
                        <Text style={{ color: PrimaryBlue, fontSize: 14, fontWeight: '500' }}>View</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    )

    const renderMembers = (members: typeof following) => (
        <ScrollView>
            {members.map((member, index) => (
                <View key={index} style={{ 
                    flexDirection: 'row', 
                    padding: 16,
                    backgroundColor: 'white',
                    marginBottom: 12,
                    borderRadius: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image 
                            source={{ uri: member.avatar }} 
                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} 
                        />
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>{member.name}</Text>
                            <Text style={{ fontSize: 14, color: PrimaryGrey, marginTop: 4 }}>@{member.username}</Text>
                        </View>
                    </View>
                    {!member.connected && (
                        <TouchableOpacity 
                            style={{ 
                                backgroundColor: PrimaryBlue, 
                                paddingHorizontal: 16, 
                                paddingVertical: 8, 
                                borderRadius: 20 
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Follow</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </ScrollView>
    )

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
             <MainHeaderNav show menu={false} post={false} />
            
            {/* Tab Headers */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LightGrey }}>
                {['causes', 'crwds', 'followers', 'following'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab as typeof activeTab)}
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            borderBottomWidth: activeTab === tab ? 2 : 0,
                            borderBottomColor: activeTab === tab ? PrimaryBlue : 'transparent',
                        }}
                    >
                        <Text style={{
                            textAlign: 'center',
                            color: activeTab === tab ? PrimaryBlue : PrimaryGrey,
                            fontSize: 14,
                            fontWeight: '500',
                            textTransform: 'capitalize'
                        }}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={{ flex: 1, padding: 16 }}>
                {activeTab === 'causes' && renderCauses()}
                {activeTab === 'crwds' && renderCRWDs()}
                {activeTab === 'followers' && renderMembers(followers)}
                {activeTab === 'following' && renderMembers(following)}
            </View>
        </SafeAreaView>
    )
} 