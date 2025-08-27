import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryBlue, PrimaryGrey } from '../Constants/Colors'
import { Search } from 'lucide-react-native'
import { useRoute } from '@react-navigation/native'

export default function Statistics() {
    const route = useRoute()
    const routeParams = route.params as { screen?: 'causes' | 'following' | 'followers' | 'crwds' } | undefined
    const defaultTab = routeParams?.screen || 'causes'
    const [activeTab, setActiveTab] = useState<'causes' | 'following' | 'followers' | 'crwds'>(defaultTab)
    const [causesSearch, setCausesSearch] = useState('')
    const [crwdsSearch, setCrwdsSearch] = useState('')

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

    // Sample data for suggested causes (matching crwd-vite)
    const suggestedCauses = [
        {
            name: "The Red Cross",
            description: "An health organization that helps people in need",
            image: require('../assets/images/redcross.png'),
            type: "Nonprofit",
        },
        {
            name: "St. Judes",
            description: "The leading children's health organization",
            image: require('../assets/images/redcross.png'),
            type: "Nonprofit",
        },
        {
            name: "Women's Healthcare of At...",
            description: "We are Atlanta's #1 healthcare organization",
            image: require('../assets/images/redcross.png'),
            type: "Nonprofit",
        },
    ]

    // Filter functions
    const filteredCauses = causes.filter(
        (cause) =>
            cause.name.toLowerCase().includes(causesSearch.toLowerCase()) ||
            cause.impact.toLowerCase().includes(causesSearch.toLowerCase())
    )

    const filteredCrwds = crwds.filter(
        (crwd) =>
            crwd.name.toLowerCase().includes(crwdsSearch.toLowerCase()) ||
            crwd.role.toLowerCase().includes(crwdsSearch.toLowerCase())
    )

    const renderCausesTab = () => (
        <View style={styles.causesContainer}>
            {suggestedCauses.map((cause, index) => (
                <View key={index} style={styles.causeItem}>
                    <View style={styles.causeInfo}>
                        <Image source={cause.image} style={styles.causeImage} />
                        <View style={styles.causeDetails}>
                            <View style={[
                                styles.typeBadge,
                                cause.type === 'CRWD' ? styles.crwdBadge : styles.nonprofitBadge
                            ]}>
                                <Text style={[
                                    styles.typeText,
                                    cause.type === 'CRWD' ? styles.crwdText : styles.nonprofitText
                                ]}>
                                    {cause.type}
                                </Text>
                            </View>
                            <Text style={styles.causeName}>{cause.name}</Text>
                            <Text style={styles.causeDescription}>{cause.description}</Text>
                        </View>
                    </View>
                    {cause.type === 'Nonprofit' && (
                        <View style={styles.causeActions}>
                            <TouchableOpacity style={styles.donateButton}>
                                <Text style={styles.donateButtonText}>Donate Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.visitProfileText}>Visit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {cause.type === 'CRWD' && (
                        <View style={styles.causeActions}>
                            <TouchableOpacity style={styles.joinButton}>
                                <Text style={styles.joinButtonText}>Join CRWD</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ))}
        </View>
    )

    const renderCRWDsTab = () => (
        <View style={styles.crwdsContainer}>
            {filteredCrwds.map((crwd, index) => (
                <View key={index} style={styles.crwdItem}>
                    <View style={styles.crwdInfo}>
                        <Image source={{ uri: crwd.avatar }} style={styles.crwdAvatar} />
                        <View>
                            <Text style={styles.crwdName}>{crwd.name}</Text>
                            <Text style={styles.crwdRole}>{crwd.role}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    )

    const renderMembersTab = (members: typeof following, title: string) => (
        <View style={styles.membersContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color={PrimaryGrey} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search members..."
                        placeholderTextColor={PrimaryGrey}
                    />
                </View>
            </View>

            {/* Members List */}
            <ScrollView style={styles.membersList}>
                {members.map((member, index) => (
                    <View key={index} style={styles.memberItem}>
                        <View style={styles.memberInfo}>
                            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                            <View>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberUsername}>@{member.username}</Text>
                            </View>
                        </View>
                        {!member.connected && (
                            <TouchableOpacity style={styles.followButton}>
                                <Text style={styles.followButtonText}>Follow</Text>
                            </TouchableOpacity>
                        )}
                        {member.connected && (
                            <TouchableOpacity style={styles.followingButton}>
                                <Text style={styles.followingButtonText}>Following</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    )

    const tabs = [
        { label: "Causes", value: "causes" },
        { label: "Following", value: "following" },
        { label: "Followers", value: "followers" },
        { label: "CRWDs", value: "crwds" },
    ]

    return (
        <SafeAreaView style={styles.container}>
            <MainHeaderNav show menu={false} post={false} />
            
           

            {/* Tab Headers */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.value}
                        onPress={() => setActiveTab(tab.value as typeof activeTab)}
                        style={[
                            styles.tab,
                            activeTab === tab.value && styles.activeTab
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.value && styles.activeTabText
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
                {activeTab === 'causes' && renderCausesTab()}
                {activeTab === 'following' && renderMembersTab(following, 'Following')}
                {activeTab === 'followers' && renderMembersTab(followers, 'Followers')}
                {activeTab === 'crwds' && renderCRWDsTab()}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: PrimaryBlue,
    },
    tabText: {
        fontSize: 14,
        color: PrimaryGrey,
        fontWeight: '500',
    },
    activeTabText: {
        color: PrimaryBlue,
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    causesContainer: {
        flex: 1,
    },
    causeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        marginBottom: 12,
        borderRadius: 8,
    },
    causeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    causeImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    causeDetails: {
        flex: 1,
        minWidth: 0,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    crwdBadge: {
        backgroundColor: '#dcfce7',
    },
    nonprofitBadge: {
        backgroundColor: '#dbeafe',
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    crwdText: {
        color: '#16a34a',
    },
    nonprofitText: {
        color: '#2563eb',
    },
    causeName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    causeDescription: {
        fontSize: 12,
        color: PrimaryGrey,
        lineHeight: 16,
    },
    causeActions: {
        alignItems: 'center',
        gap: 8,
    },
    donateButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    donateButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    joinButton: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    visitProfileText: {
        color: PrimaryBlue,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    crwdsContainer: {
        flex: 1,
    },
    crwdItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
    },
    crwdInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    crwdAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    crwdName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },
    crwdRole: {
        fontSize: 12,
        color: PrimaryGrey,
        marginTop: 4,
    },
    viewButton: {
        backgroundColor: '#F0F2FB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 0,
    },
    viewButtonText: {
        color: PrimaryBlue,
        fontSize: 14,
        fontWeight: '500',
    },
    membersContainer: {
        flex: 1,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#000',
    },
    membersList: {
        flex: 1,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LightGrey,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },
    memberUsername: {
        fontSize: 12,
        color: PrimaryGrey,
        marginTop: 4,
    },
    followButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    followingButton: {
        backgroundColor: PrimaryBlue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
}) 