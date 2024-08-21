import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import Peer from "simple-peer";

const socket = io("https://chatroom-ouj0.onrender.com");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [myId, setMyId] = useState("");
  const [peers, setPeers] = useState([]);
  const myVideo = useRef();
  const peersRef = useRef([]);
  const [stream, setStream] = useState();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      myVideo.current.srcObject = stream;
    });

    socket.on("user-connected", (userId) => {
      // When a new user connects, create a peer and send them a signal
      const peer = createPeer(userId, socket.id, stream);
      peersRef.current.push({ peerID: userId, peer });
      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    socket.on("user-joined", (payload) => {
      // When we receive a signal from a user, add their stream
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({ peerID: payload.callerID, peer });
      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    socket.on("receiving-returned-signal", (payload) => {
      // When we receive a signal back, connect the peer
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      item.peer.signal(payload.signal);
    });

    socket.on("user-disconnected", (userId) => {
      // Handle user disconnects by removing the peer from the list
      const peerObj = peersRef.current.find((p) => p.peerID === userId);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers(peersRef.current.map((p) => p.peer));
    });
  }, []);

  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
    socket.emit("join-room", newRoomId, socket.id);
    setMyId(socket.id);
  };

  const joinRoom = () => {
    socket.emit("join-room", roomId, socket.id);
    setMyId(socket.id);
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", (stream) => {
      setPeers((prevPeers) => [...prevPeers, peer]);
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

    peer.on("stream", (stream) => {
      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center items-center h-screen">
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID or leave empty to create a new room"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={createRoom}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Room
            </button>
            <button
              onClick={joinRoom}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Join Room
            </button>
          </div>
          {roomId && (
            <div className="mt-4">
              <p>Share this link to invite others:</p>
              <p className="text-blue-500 underline">
                {`${window.location.origin}/?roomId=${roomId}`}
              </p>
            </div>
          )}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <video playsInline muted ref={myVideo} autoPlay className="w-full h-auto" />
            {peers.map((peer, index) => (
              <Video key={index} peer={peer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video playsInline ref={ref} autoPlay className="w-full h-auto" />;
};

export default VideoChat;
