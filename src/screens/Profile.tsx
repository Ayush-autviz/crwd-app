import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MainHeaderNav from '../components/MainHeaderNav'
import ProfileBio from '../components/ProfileBio'
import ProfileStats from '../components/ProfileStats'
import PopularPosts from '../components/PopularPosts'

export default function Profile() {

    const profileActivity =[
    
        {
          id: 1,
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          username: "mynameismya",
          time: "17h",
          org: "marchofdimes",
          orgUrl: "/profile",
          text: `The quick, brown fox jumps over a lazy dog.\nDJs flock by when MTV ax quiz prog. Junk`,
          imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
          likes: 2,
          comments: 0,
          shares: 3,
        },
        {
          id: 2,
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          username: "mynameismya",
          time: "1d",
          org: "feedthehungry",
          orgUrl: "/profile",
          text: `Had a great time volunteering at the food bank today! So many smiles and so much hope.`,
          imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
          likes: 5,
          comments: 1,
          shares: 0,
        },
        {
          id: 3,
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          username: "mynameismya",
          time: "2d",
          org: "greenearth",
          orgUrl: "/profile",
          text: `Excited to join the Green Earth clean-up event this weekend! Let's make a difference together. 🌱`,
          likes: 8,
          comments: 2,
          shares: 1,
        },
        {
          id: 4,
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          username: "mynameismya",
          time: "3d",
          org: "animalrescue",
          orgUrl: "/profile",
          text: `Met some adorable pups at the shelter. Please consider adopting or fostering if you can! 🐶❤️`,
          imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&q=80",
          likes: 12,
          comments: 3,
          shares: 4,
        },
      
]

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav />
        <ScrollView style={{paddingHorizontal: 20}}>

        <ProfileBio />
        <ProfileStats />
        
        <PopularPosts posts={profileActivity} showTitle={false} />
        </ScrollView>
    </SafeAreaView>
  )
}