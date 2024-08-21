import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

// const socket = io("http://localhost:3001");
const socket = io("https://chatroom-ouj0.onrender.com");

const VideoChat = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    if (isRoomCreated) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        userVideo.current.srcObject = stream;

        socket.on("user-connected", (userId) => {
          const peer = createPeer(userId, socket.id, stream);
          peersRef.current.push({
            peerID: userId,
            peer,
          });
        });

        socket.on("receive-signal", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });
        });

        socket.on("signal-returned", (payload) => {
          const peer = peersRef.current.find((p) => p.peerID === payload.id);
          peer.peer.signal(payload.signal);
        });

        socket.on("user-disconnected", (userId) => {
          const peerObj = peersRef.current.find((p) => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
        });

        socket.emit("join-room", { roomId, name });
      });
    }
  }, [isRoomCreated, roomId, name]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("send-signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", (incomingStream) => {
      const videoElement = document.createElement("video");
      videoElement.srcObject = incomingStream;
      videoElement.play();
      document.getElementById("video-grid").appendChild(videoElement);
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
      socket.emit("return-signal", { signal, callerID });
    });

    peer.on("stream", (incomingStream) => {
      const videoElement = document.createElement("video");
      videoElement.srcObject = incomingStream;
      videoElement.play();
      document.getElementById("video-grid").appendChild(videoElement);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const handleRoomAction = () => {
    if (name.trim() && roomId.trim()) {
      setIsRoomCreated(true);
    }
  };

  return (
    <div className="p-4 container mx-auto">
      <div className="flex justify-center items-center h-screen">
        {!isRoomCreated ? (
          <div>
            <input
              type="text"
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 mb-4"
            />
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="border p-2 mb-4"
            />
            <button onClick={handleRoomAction} className="bg-blue-500 text-white p-2 rounded">
              Join or Create Room
            </button>
          </div>
        ) : (
          <div>
            <div id="video-grid" className="grid grid-cols-2 gap-4">
              <video playsInline muted ref={userVideo} autoPlay className=" rounded-xl w-full h-auto" /><br />
              <p>{name}</p>
              {/* Additional video elements will be appended here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
