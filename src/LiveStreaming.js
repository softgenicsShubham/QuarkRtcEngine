import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { registerGlobals } from 'react-native-webrtc'
import { Device } from 'mediasoup-client';

registerGlobals()
const LiveStreaming = () => {

  const device = new Device()

  
  
  return (
    <View>
      <Text>LiveStreaming</Text>
    </View>
  )
}

export default LiveStreaming

const styles = StyleSheet.create({})