import {
  Button,
  Dimensions,
  FlatList,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  ScreenCapturePickerView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals
} from 'react-native-webrtc';
import { io } from 'socket.io-client'
import * as mediasoup from 'mediasoup-client'


let params = {
  // mediasoup params
  encodings: [
    {
      rid: 'r0',
      maxBitrate: 100000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r1',
      maxBitrate: 300000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r2',
      maxBitrate: 900000,
      scalabilityMode: 'S1T3',
    },
  ],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000
  }
}



registerGlobals()
const { width, height } = Dimensions.get('screen')
const LiveStreaming = () => {
  const socketRef = useRef(null);
  const producerTransport = useRef(null)
  const [localStream, setLocalStream] = useState(null);
  const [isFront, setIsFront] = useState(true);
  const deviceRef = useRef();
  let mediaConstraints = {
    audio: true,
    video: {
      facingMode: isFront ? 'user' : 'environment',
    },
  };

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const createDevice = async () => {
    try {
      const data = {
        type: 'getRtpCapabilities'
      }
      const device = new mediasoup.Device();
      // device.createSendTransport
      deviceRef.current = device;
      socketRef.current.emit('message', data)

    } catch (error) {
      console.log(error)
    }
  }

  const loadDevice = async (routerRtpCapabilities) => {
    await deviceRef.current.load({ routerRtpCapabilities });
    await createAndSendTransPort()
  }

  const createAndSendTransPort = async () => {
    const data = {
      type: 'join',
      roomId: 'shubhamghanghotia'
    }
    socketRef.current.emit('message', data)
  }


  const switchCamera = async () => {
    setIsFront(!isFront);
    try {
      const mediaStream = await mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(mediaStream);
    } catch (error) {
      console.log(error);
    }
  };


  const connectSendTransport = async () => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    const producer = await producerTransport.current.produce(params)

    producer.on('trackended', () => {
      console.log('track ended')

      // close video track
    })

    producer.on('transportclose', () => {
      console.log('transport ended')

      // close video track
    })
  }





  const handleSocketConnection = async () => {
    socketRef.current = io('http://192.168.1.38:3000')

    /**
     * For getting the rtp capabilities from the server router
     */
    socketRef.current.on('RtpCapabilities', (data) => {
      loadDevice(data?.rtpCapabilities)
      console.log(data)
    })

    /**
     * For getitng the router transport from the server
     */
    socketRef.current.on('transport', (data) => {
      producerTransport.current = deviceRef.current.createSendTransport(data)
      console.log(data)
    })

    /**
     * Here when the producers tranports got connected then we are emmotin an event to server 
     * transport got connected
     */
    producerTransport.current?.on('connect', async (data) => {
      console.log('producers transport data are displaying here', data)
      await socketRef.current?.on('transport-connect', data)
    })

    /**
     * Produce event from the producers tranport
     */
    producerTransport.current?.on('produce', async (data) => {
      console.log('producers transport produce data are displaying', data)
      await socketRef.current.emit('transport-produce', {
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        appData: data.appData,
      })
    })

  }
  const initialize = async () => {
    try {
      await getPermission();
      await switchCamera();
      await handleSocketConnection()
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    initialize();
  }, []);






  return (
    <View style={styles.main_container}>
      {localStream && (
        <RTCView
          mirror={true}
          objectFit={'cover'}
          streamURL={localStream.toURL()}
          zOrder={0}
          style={{ flex: 1 }}
        />
      )}
      <View style={styles.button_view}>
        <TouchableOpacity style={styles.button} onPress={switchCamera}>
          <Text style={styles.text}>
            Switch Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={createDevice}>
          <Text style={styles.text}>
            Create Device
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={{}}>
          <Text style={styles.text}>
            getRtpCapabilities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={connectSendTransport}>
          <Text style={styles.text}>
            connectSendTransport
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LiveStreaming;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  button_view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    position: 'absolute',
    width: width,
    bottom: 40
  },
  button: {
    width: width / 4.5,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    borderRadius: 1000
  },
  text: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900'
  }
});
