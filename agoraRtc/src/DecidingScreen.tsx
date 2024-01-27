import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

const DecidingScreen: React.FC = () => {
    const navigation = useNavigation()


    return (
        <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Button title='Start live' onPress={() => {navigation.navigate('BoradcasterScreen')}} />
            <Button title='Watch live' onPress={() => {navigation.navigate('AudienceScreen')}} />
        </View>
    )
}

export default DecidingScreen

const styles = StyleSheet.create({})
