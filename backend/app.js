const express = require('express');
const http = require('http');
const mediasoup = require('mediasoup');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let worker;
let router;

const PORT = 3000;

async function startMediasoup() {
  worker = await mediasoup.createWorker();
  router = await worker.createRouter();
}

startMediasoup();

// Map to store active transports, producers, and consumers
const transports = new Map();
const producers = new Map();
const consumers = new Map();



io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle WebRTC signaling messages
  socket.on('message', (message) => {
    handleSignalingData(socket, message);
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    handleClientDisconnect(socket);
  });
});






async function handleSignalingData(socket, message) {
  switch (message.type) {
    case 'join':
      handleJoin(socket, message);
      break;

    case 'offer':
      handleOffer(socket, message);
      break;

    case 'answer':
      handleAnswer(socket, message);
      break;

    case 'ice-candidate':
      handleIceCandidate(socket, message);
      break;

    default:
      break;
  }
}

async function handleJoin(socket, message) {
  const { roomId } = message;
  console.log(`${socket.id} joined room ${roomId}`);

  // Create WebRTC transport for the client
  const transport = await router.createWebRtcTransport();
  transports.set(socket.id, transport);

  // Send the transport parameters to the client
  socket.emit('transport', {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  });
}

async function handleOffer(socket, message) {
  const { roomId, offer, targetSocketId } = message;
  console.log(`${socket.id} sent an offer to ${targetSocketId}`);

  // Create a WebRTC producer for the client
  const producerTransport = transports.get(socket.id);
  const producer = await producerTransport.produce({
    kind: 'audio', // or 'video'
    rtpParameters: offer.rtpParameters,
  });
  producers.set(socket.id, producer);

  // Send the offer to the target client
  io.to(targetSocketId).emit('offer', {
    roomId,
    offer,
    socketId: socket.id,
  });
}

async function handleAnswer(socket, message) {
  const { answer, targetSocketId } = message;
  console.log(`${socket.id} sent an answer to ${targetSocketId}`);

  // Get the producer for the target client
  const producer = producers.get(targetSocketId);

  // Connect the producer to the client's WebRTC transport
  await producer.connect({
    ...answer,
  });
}

async function handleIceCandidate(socket, message) {
  const { targetSocketId, candidate } = message;
  console.log(`${socket.id} sent ICE candidate to ${targetSocketId}`);

  // Get the WebRTC transport for the target client
  const transport = transports.get(targetSocketId);

  // Add the ICE candidate
  await transport.addIceCandidate(candidate);
}

function handleClientDisconnect(socket) {
  console.log(`${socket.id} disconnected`);

  // Clean up resources for the disconnected client
  const transport = transports.get(socket.id);
  if (transport) {
    transport.close();
    transports.delete(socket.id);
  }

  const producer = producers.get(socket.id);
  if (producer) {
    producer.close();
    producers.delete(socket.id);
  }

  const consumer = consumers.get(socket.id);
  if (consumer) {
    consumer.close();
    consumers.delete(socket.id);
  }
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
