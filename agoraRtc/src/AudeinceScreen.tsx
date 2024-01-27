import { Button, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import createAgoraRtcEngine, { ChannelMediaOptions, ChannelProfileType, ClientRoleType, IRtcEngineEx, RtcSurfaceView } from 'react-native-agora';





const appId = "317633f93b814adc8a92fc623c4917f5";
const channelName = 'testing'
const token = '007eJxTYFD86Vf+/K5e5L59Jzt/HHpxzzfQ9/cdObbLl4pezQ/cLyivwGBsaG5mbJxmaZxkYWiSmJJskWhplJZsZmScbGJpaJ5mGpm9JbUhkJHhjLIWIyMDBIL47AwlqcUlmXnpDAwAfaQijg=='

const channelName2 = 'testing2'
const toekn2 = '007eJxTYBBWmrhJttdC2VQjPu3WoTNBe6fVZR/9W6bclHW28WJYX7QCg7GhuZmxcZqlcZKFoUliSrJFoqVRWrKZkXGyiaWheZrpuuwtqQ2BjAwX/7EzMTJAIIjPwVCSWlySmZduxMAAAJT3INA=';
const uid = 0
const secondUid = 1000

const AudeinceScreen = () => {
    const rtcEngineRef = useRef<IRtcEngineEx>();
    const [isJoined, setIsJoined] = useState<number>(0)
    const [isSecondJoined, setIsSecondJoined] = useState<number>(0)



    const initialize = () => {
        rtcEngineRef.current = createAgoraRtcEngine() as IRtcEngineEx;
        const agoraEngine = rtcEngineRef.current;
        agoraEngine.registerEventHandler({
            onJoinChannelSuccess: (connection, _Uid) => {
                console.log("Joined event called" + connection.channelId + connection.localUid)
                if (connection.channelId === 'testing2') {
                    // setIsSecondJoined(true)
                };
                if (connection.channelId == 'testing') {
                    // setIsJoined(true)
                }
            },
            onUserJoined: (connection, Uid) => {
                if (connection.channelId === 'testing2') {
                    setIsSecondJoined(Uid)
                };
                if (connection.channelId == 'testing') {
                    setIsJoined(Uid)
                }
            },
            onUserOffline: (_connection, Uid) => {
                console.log("User gone offline")
            },
        });
        agoraEngine.initialize({
            appId: appId,
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        agoraEngine.enableVideo();

    }

    useEffect(() => {
        initialize()
    }, [])


    const joinChannelFirst = async () => {
        if (isJoined) {
            return;
        } else {
            rtcEngineRef.current?.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
            // rtcEngineRef.current?.startPreview();
            rtcEngineRef.current?.joinChannel(token, channelName, uid, {
                clientRoleType: ClientRoleType.ClientRoleAudience
            });
        }

    }


    const joinChannelSecond = async () => {
        if (isSecondJoined) {
            return;
        } else {
            var mediaOptions = new ChannelMediaOptions();
            mediaOptions.autoSubscribeAudio = true;
            mediaOptions.autoSubscribeVideo = true;
            mediaOptions.clientRoleType = ClientRoleType.ClientRoleAudience;
            rtcEngineRef.current?.joinChannelEx(
                toekn2,
                {
                    localUid: secondUid,
                    channelId: channelName2,
                },
                mediaOptions,
            );
            // rtcEngineRef.current?.startPreview()
        }
    }














    return (
        <View style={{ flex: 1 }}>
            <View>
                <Button title='First channel' disabled={isJoined ? true : false} onPress={joinChannelFirst} />
                <Button title='Second channel' disabled={isSecondJoined ? true : false} onPress={joinChannelSecond} />
            </View>
            {isJoined ? (
                <React.Fragment key={0}>
                    <RtcSurfaceView canvas={{ uid: isJoined }} style={styles.videoView} />
                    <Text>Local user uid: {uid}</Text>
                </React.Fragment>
            ) : (
                <Text>{isJoined ? 'Join a channel' : ''}</Text>
            )}

            {isSecondJoined ? (
                <React.Fragment key={1}>
                    <RtcSurfaceView canvas={{ uid: isSecondJoined }} style={styles.videoView} />
                    <Text>Local user uid: {uid}</Text>
                </React.Fragment>
            ) : (
                <Text>{isSecondJoined ? 'Join a channel' : ''}</Text>
            )}

        </View>
    )
}

export default AudeinceScreen;

const styles = StyleSheet.create({
    videoView: {
        width: '100%',
        height: '40%'
    }
})