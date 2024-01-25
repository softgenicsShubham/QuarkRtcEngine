import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { MediaStream, RTCView, registerGlobals } from 'react-native-webrtc'
import { Device } from 'mediasoup-client';
import { Socket, io } from 'socket.io-client';
import * as mediasoup from 'mediasoup-client'
import { Consumer, Transport } from 'mediasoup-client/lib/types';



registerGlobals();
const { width, height } = Dimensions.get('screen')
const Starting: React.FC = () => {
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const deviceRef = useRef<Device>()
  const socketRef = useRef<Socket>();
  const rcvTransport = useRef<Transport>()
  const [time, setTime] = useState<number>()


  const createDevice = async () => {
    deviceRef.current = new mediasoup.Device();
    const data = { socketId: socketRef.current?.id }
    socketRef.current?.emit('getRtpCapabilities', data)
  }

  const generateRouterTransport = async () => {
    const sctpCapabilities = deviceRef.current?.sctpCapabilities;
    socketRef.current?.emit('createServerTransport', sctpCapabilities)
  }


  const connectRecvTransport = async () => {

    await socketRef.current?.emit('consume', {
      rtpCapabilities: deviceRef.current?.rtpCapabilities,
    }, async ({ params }) => {
      if (params.error) {
        console.log('Cannot Consume')
        return
      }

      console.log(params)
      // then consume with the local consumer transport
      // which creates a consumer
      let consumer = await rcvTransport.current?.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      })

      // destructure and retrieve the video track from the producer
      const { track } = consumer;

      setRemoteStream(new MediaStream([track]))

      // the server consumer started with media paused
      // so we need to inform the server to resume
      socketRef.current?.emit('consumer-resume')
    })
  }





  useEffect(() => {
    if (rcvTransport.current) {
      rcvTransport.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-recv-connect', ...)
          await socketRef.current?.emit('transport-recv-connect', {
            dtlsParameters,
          })

          // Tell the transport that parameters were transmitted.
          callback()
        } catch (error: any) {
          // Tell the transport that something was wrong
          errback(error)
        }
      })
    }
  }, [time])




  const initializeSocket = async () => {
    socketRef.current = io('http://192.168.1.38:3000');
    socketRef.current.on('sendingRtpCapablities', async (data) => {
      await deviceRef.current?.load({ routerRtpCapabilities: data })
      console.log(deviceRef.current?.canProduce('video'))
    })

    socketRef.current?.on('transport', (data) => {
      rcvTransport.current = deviceRef.current?.createRecvTransport(data)
      console.log('transport', data)
      setTime(Date.now())
    })

  }

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [])






console.log(remoteStream)




  return (
    <View style={styles.main_container}>

      {remoteStream && (
        <RTCView
          mirror={true}
          objectFit={'cover'}
          streamURL={remoteStream.toURL()}
          zOrder={0}
          style={styles.rtc_view}
        />
      )}


      <View style={styles.button_view}>

        <TouchableOpacity
          onPress={createDevice}
          style={styles.button}>
          <Text style={styles.text}>Create Device</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={generateRouterTransport}
          style={styles.button}>
          <Text style={styles.text}>Create Rcv Transport</Text>
        </TouchableOpacity>


        <TouchableOpacity
          onPress={connectRecvTransport}
          style={styles.button}>
          <Text style={styles.text}>start watching</Text>
        </TouchableOpacity>




      </View>





    </View>
  )
}

export default Starting

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
    backgroundColor: '#000'
  },
  button_view: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width,
    alignItems: 'center',
    position: 'absolute',
    bottom: 10
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
    flex: 1,
    width: width,
    height: height
  }
})
