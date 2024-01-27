import { PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BroadcasterScreen from './src/BroadcasterScreen';
import AudeinceScreen from './src/AudeinceScreen';
import DecidingScreen from './src/DecidingScreen';



const Stack = createNativeStackNavigator()

const App: React.FC = () => {
  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };



  return (
    <NavigationContainer onReady={getPermission}>
      <Stack.Navigator>
        <Stack.Screen name='DecidingScreen' component={DecidingScreen} />
        <Stack.Screen name='BoradcasterScreen' component={BroadcasterScreen} />
        <Stack.Screen name='AudienceScreen' component={AudeinceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})