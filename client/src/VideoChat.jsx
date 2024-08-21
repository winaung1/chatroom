import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { useParams } from 'react-router-dom';

// const socket = io('http://localhost:3001');
const socket = io('https://chatroom-ouj0.onrender.com');

const VideoChat = () => {
  const [name, setName] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const { roomId } = useParams();

  useEffect(() => {
    if (!roomId) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      userVideo.current.srcObject = stream;
      setLocalStream(stream);

      socket.emit('join-room', { roomId, name });

      socket.on('user-connected', (userId) => {
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({ peerID: userId, peer });
      });

      socket.on('receive-signal', (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({ peerID: payload.callerID, peer });
      });

      socket.on('signal-returned', (payload) => {
        const peer = peersRef.current.find((p) => p.peerID === payload.id);
        peer.peer.signal(payload.signal);
      });

      socket.on('user-disconnected', (userId) => {
        const peerObj = peersRef.current.find((p) => p.peerID === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);

        // Remove the disconnected user's video
        const videoElement = document.getElementById(`peer-${userId}`);
        if (videoElement) videoElement.remove();
      });

      return () => {
        socket.disconnect();
        localStream?.getTracks().forEach((track) => track.stop()); // Stop local stream tracks on unmount
      };
    });
  }, [roomId, name]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('send-signal', { userToSignal, callerID, signal });
    });

    peer.on('stream', (incomingStream) => {
      addVideoStream(incomingStream, userToSignal);
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('return-signal', { signal, callerID });
    });

    peer.on('stream', (incomingStream) => {
      addVideoStream(incomingStream, callerID);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const addVideoStream = (stream, peerId) => {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.play();
    videoElement.classList.add('rounded-xl', 'w-full', 'h-auto');
    videoElement.id = `peer-${peerId}`;
    document.getElementById('video-grid').appendChild(videoElement);
  };

  return (
    <div className="p-4 container mx-auto">
      <div className="flex justify-center items-center h-screen">
        <div>
          <div id="video-grid" className="grid grid-cols-2 gap-4">
            <video
              playsInline
              muted
              ref={userVideo}
              autoPlay
              className="rounded-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
