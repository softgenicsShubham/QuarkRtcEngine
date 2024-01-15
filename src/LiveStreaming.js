import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RTCPeerConnection, RTCView, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import io from 'socket.io-client';

const LiveStreaming = () => {
  const [streamURL, setStreamURL] = useState(null);
  const localStream = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    const init = async () => {
      // Initialize WebRTC connection
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const peerConnection = new RTCPeerConnection(configuration);

      // Add event listeners for WebRTC connection
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to the server
          socket.current.emit('message', { type: 'ice-candidate', targetSocketId: 'TARGET_SOCKET_ID', candidate: event.candidate });
        }
      };

      // Create local media stream
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Add local media stream to WebRTC connection
      localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to the server
      socket.current.emit('message', { type: 'offer', offer, targetSocketId: 'TARGET_SOCKET_ID' });
    };

    init();
  }, []);

  useEffect(() => {
    // Connect to the WebSocket server
    socket.current = io('http://YOUR_SERVER_IP:3000');

    // Handle incoming messages from the server
    socket.current.on('message', (message) => {
      handleSignalingData(message);
    });

    return () => {
      // Clean up resources when the component is unmounted
      socket.current.disconnect();
      localStream.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSignalingData = (data) => {
    switch (data.type) {
      case 'offer':
        handleOffer(data);
        break;

      case 'answer':
        handleAnswer(data);
        break;

      case 'ice-candidate':
        handleIceCandidate(data);
        break;

      default:
        break;
    }
  };

  const handleOffer = async (offer) => {
    // Create a new WebRTC connection for the remote stream
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);

    // Add event listeners for the new WebRTC connection
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to the server
        socket.current.emit('message', { type: 'ice-candidate', targetSocketId: 'TARGET_SOCKET_ID', candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      // Handle incoming media stream
      setStreamURL(event.streams[0].toURL());
    };

    // Set remote description and create an answer
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer to the server
    socket.current.emit('message', { type: 'answer', answer, targetSocketId: 'TARGET_SOCKET_ID' });
  };

  const handleAnswer = async (answer) => {
    // Set remote description for the initial WebRTC connection
    const peerConnection = localStream.current._tracks[0]._attachedStreams[0]._connection;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer.answer));
  };

  const handleIceCandidate = async (iceCandidate) => {
    // Add ICE candidate to the initial WebRTC connection
    const peerConnection = localStream.current._tracks[0]._attachedStreams[0]._connection;
    await peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate.candidate));
  };

  return (
    <View style={styles.container}>
      {streamURL && <RTCView streamURL={streamURL} style={styles.video} />}
      <Text>VideoCall</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
  },
});

export default LiveStreaming;