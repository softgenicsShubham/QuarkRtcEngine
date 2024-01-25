import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveStreaming from './src/LiveStreaming';
import LiveStream from './src/LiveStream';
import Starting from './src/Starting';


const Stack = createNativeStackNavigator()
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{

      }}>

        <Stack.Screen
          name='LiveStreaming'
          component={LiveStreaming}
          options={{
            headerShown: false
          }}
        />


        <Stack.Screen
          name='Starting'
          component={Starting}
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name='LiveStream'
          component={LiveStream}
          options={{
            headerShown: false
          }}
        />




      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})