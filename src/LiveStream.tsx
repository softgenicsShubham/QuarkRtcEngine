import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import React, {
    useEffect,
    useRef,
    useState
} from 'react'
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
import * as mediasoup from 'mediasoup-client'
import { Socket, io } from 'socket.io-client';
import { Producer, Transport, TransportEvents, UnsupportedError } from 'mediasoup-client/lib/types';

const { width, height } = Dimensions.get('screen')
registerGlobals()
const LiveStream = () => {
    const [localStream, setLocalSream] = useState<MediaStream>();
    const [isFront, setIsFront] = useState<boolean>(true)
    const socketRef = useRef<Socket>();
    const deviceRef = useRef<mediasoup.Device>();
    const sendTransport = useRef<Transport>()
    const [time, setTime] = useState<number>()

    console.log(sendTransport.current?.eventNames())


    const createDevice = async () => {
        deviceRef.current = new mediasoup.Device();
        const data = { socketId: socketRef.current?.id }
        socketRef.current?.emit('getRtpCapabilities', data)
    }

    const generateRouterTransport = async () => {
        const sctpCapabilities = deviceRef.current?.sctpCapabilities;
        socketRef.current?.emit('createServerTransport', sctpCapabilities)
    }

    const startProducing = async () => {
        let mediaConstraints = {
            audio: true,
            video: {
                frameRate: 30,
                facingMode: isFront ? 'user' : 'environment'
            }
        }
        const mediaStream = await mediaDevices.getUserMedia(mediaConstraints);
        let videoTrack = await mediaStream.getVideoTracks()[0];
        setLocalSream(mediaStream)
        const webcamProducer = await sendTransport.current.produce({ track: videoTrack });
        console.log('webcamProducer', webcamProducer)
    }


    useEffect(() => {
        if (sendTransport.current) {
            console.log('have data')
            sendTransport.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log("send transport connect method called");

                try {
                    socketRef.current?.emit('transport-connect', {
                        transportId: sendTransport.current?.id,
                        dtlsParameters,
                    });

                    // Done in the server, tell our transport.
                    callback();
                } catch (error: any) {
                    // Something was wrong on the server side.
                    errback(error);
                }
            });

            sendTransport.current.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
                console.log("send transport produces method called");

                try {
                    await socketRef.current?.emit('transport-produce', {
                        kind: kind,
                        rtpParameters: rtpParameters,
                        appData: appData,
                    }, ({ id }) => {
                        callback({ id })
                    })
                } catch (error) {
                    errback(error)
                }
            },
            );
        }
    }, [time])



    const initializeSocket = async () => {
        socketRef.current = io('http://192.168.1.38:3000');
        socketRef.current.on('sendingRtpCapablities', async (data) => {
            await deviceRef.current?.load({ routerRtpCapabilities: data })
            console.log(deviceRef.current?.canProduce('video'))
        })

        socketRef.current?.on('transport', (data) => {
            sendTransport.current = deviceRef.current?.createSendTransport(data)
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




    return (
        <View style={styles.main_container}>
            {localStream && (
                <RTCView
                    mirror={true}
                    objectFit={'cover'}
                    streamURL={localStream.toURL()}
                    zOrder={0}
                    style={styles.rtc_view}
                />
            )}
            <View style={styles.button_view}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={createDevice}>
                    <Text style={styles.text}>Create Device</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={generateRouterTransport}>
                    <Text style={styles.text}>
                        Router Transport
                    </Text>
                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.button}
                    onPress={startProducing}>
                    <Text style={styles.text}>
                        start producing
                    </Text>
                </TouchableOpacity>


            </View>
        </View>
    )
}

export default LiveStream

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
        flex: 1
    }
})


