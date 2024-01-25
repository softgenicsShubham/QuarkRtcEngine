import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('screen')
const LiveStreaming: React.FC = () => {
  const navigation = useNavigation()
  return (
    <View style={styles.main_container}>


      <View style={styles.button_view}>

        <TouchableOpacity
          onPress={() => { navigation.navigate('LiveStream') }}
          style={styles.button}>
          <Text style={styles.text}>Become a producers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { navigation.navigate('Starting') }}
          style={styles.button}>
          <Text style={styles.text}>Become a consumer</Text>
        </TouchableOpacity>






      </View>

    </View>
  )
}

export default LiveStreaming

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
    backgroundColor: '#000999'
  },
  button_view: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width,
    alignItems: 'center',
    position: 'absolute',
    bottom: height / 2
  },
  button: {
    width: width / 4.5,
    height: 35,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1000
  },
  text: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900'
  },
  rtc_view: {
    flex: 1
  }
})
