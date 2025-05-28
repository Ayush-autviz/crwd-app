import { View, Text, SafeAreaView, ScrollView, FlatList } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryGrey, SecondaryBlue } from '../../Constants/Colors'

export default function About() {

    const values = [{
        name: 'Transparency',
        description: 'We believe in complete transparency in all our operations and transactions.'
    },
    {
        name: 'Community',
        description: 'Building strong, supportive communities is at the heart of everything we do.'
    },
    {
        name: 'Impact',
        description: 'We measure our success by the positive impact we create in communities.'
    },
]

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
            <MainHeaderNav show={true} />
            <ScrollView style={{ paddingHorizontal: 20, marginTop: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>About CRWD</Text>
                <Text style={{ fontSize: 14, color: PrimaryGrey, paddingHorizontal: 20, textAlign: 'center' }}>
                    CRWD is a platform dedicated to connecting people with causes they care about. We believe in the power of community and collective action to create positive change.
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 10, marginTop: 20 }}>Our Mission</Text>
                <Text style={{ fontSize: 14, color: PrimaryGrey }}>
                    To empower individuals and communities to make a difference by providing a platform that facilitates meaningful connections, transparent donations, and impactful actions.
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 10, marginTop: 20 }}>Our Values</Text>
                <FlatList
                    data={values}
                    renderItem={({ item }) => (
                        <View style={{ marginBottom: 10, paddingBottom: 10 , backgroundColor: SecondaryBlue, padding: 10, borderRadius: 10 }}>
                            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>{item.name}</Text>
                            <Text style={{ fontSize: 14, color: PrimaryGrey }}>{item.description}</Text>
                        </View>
                    )}
                />
            </ScrollView>
        </SafeAreaView>
  )
}