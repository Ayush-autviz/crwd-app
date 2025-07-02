import { View, Text, TextInput, FlatList, ScrollView } from 'react-native'
import React from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { LightGrey, PrimaryGrey } from '../Constants/Colors'
import { Search } from 'lucide-react-native'
import TopicList from '../components/TopicList'
import SuggestedCrwd from '../components/SuggestedCrwd'
import SuggestdCauses from '../components/SuggestdCauses'
import NearbyCauses from '../components/NearbyCauses'
import PopularPosts from '../components/PopularPosts'

export default function Home() {

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

    const popularPosts = [
        {
            id: 5,
            avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
            username: "johnnydoe",
            time: "4d",
            org: "youth4change",
            orgUrl: "/profile",
            text: `Just wrapped up an amazing youth leadership workshop! So proud of everyone who participated.`,
            imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
            likes: 15,
            comments: 4,
            shares: 2,
        },
        {
            id: 6,
            avatarUrl: "https://randomuser.me/api/portraits/women/55.jpg",
            username: "sarahsmiles",
            time: "5d",
            org: "cleanwaternow",
            orgUrl: "/profile",
            text: `We distributed clean water kits to over 100 families this week. Thank you to all our volunteers! 💧`,
            imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
            likes: 22,
            comments: 5,
            shares: 6,
        },
        {
            id: 7,
            avatarUrl: "https://randomuser.me/api/portraits/men/54.jpg",
            username: "mikegreen",
            time: "6d",
            org: "treeplanters",
            orgUrl: "/profile",
            text: `Planted 200 trees this weekend! Let's keep making our city greener. 🌳`,
            imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80", likes: 30,
            comments: 7,
            shares: 10,
        },
        {
            id: 8,
            avatarUrl: "https://randomuser.me/api/portraits/women/60.jpg",
            username: "emilywrites",
            time: "1w",
            org: "literacyforall",
            orgUrl: "/profile",
            text: `Hosted a book drive for local schools. Thank you to everyone who donated books! 📚`,
            imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80",
            likes: 18,
            comments: 2,
            shares: 3,
        }]

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
                <FlatList data={categories}
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


{/* <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {interests.map((interest, index) => (
          <View key={index} style={{
            backgroundColor: LightGrey,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20
          }}>
            <Text style={{ fontSize: 12, color: '#374151' }}>{interest}</Text>
          </View>
        ))}
      </View> */}

                <SuggestdCauses />

                <NearbyCauses />

                <PopularPosts posts={popularPosts}/>

            </ScrollView>
        </View>
    )
}