// const socket = io("https://chatroom-ouj0.onrender.com");

import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:3001");

const VideoChat = () => {
  const [peers, setPeers] = useState([]);
  const roomId = "my-room-id"; // Use a predefined room ID for testing
  const myVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      streamRef.current = stream;
      myVideo.current.srcObject = stream;

      socket.emit("join-room", { roomId });

      socket.on("user-connected", (userId) => {
        console.log(`User connected: ${userId}`);
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers((prevPeers) => [...prevPeers, peer]);
      });

      socket.on("user-joined", ({ signal, callerID }) => {
        console.log(`User joined: ${callerID}`);
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer });
        setPeers((prevPeers) => [...prevPeers, peer]);
      });

      socket.on("receiving-returned-signal", ({ signal, id }) => {
        const item = peersRef.current.find((p) => p.peerID === id);
        item.peer.signal(signal);
      });

      socket.on("user-disconnected", (userId) => {
        console.log(`User disconnected: ${userId}`);
        const peerObj = peersRef.current.find((p) => p.peerID === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
        setPeers(peersRef.current.map((p) => p.peer));
      });
    });
  }, []);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", (incomingStream) => {
      addVideoStream(incomingStream);
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.on("stream", (incomingStream) => {
      addVideoStream(incomingStream);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const addVideoStream = (stream) => {
    const videoElement = document.createElement("video");
    videoElement.srcObject = stream;
    videoElement.play();
    document.getElementById("video-grid").appendChild(videoElement);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center items-center h-screen">
        <div>
          <div id="video-grid" className="grid grid-cols-2 gap-4">
            <video playsInline muted ref={myVideo} autoPlay className="w-full h-auto" />
            {/* Additional video elements will be appended here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
