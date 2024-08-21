import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import Peer from "simple-peer";

const socket = io("http://localhost:3001");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [myId, setMyId] = useState("");
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState();
  const [peers, setPeers] = useState([]);
  const myVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      myVideo.current.srcObject = stream;
    });

    socket.on("user-connected", (userId) => {
      const peer = addPeer(userId, stream);
      peersRef.current.push({ peerID: userId, peer });
      setPeers((peers) => [...peers, peer]);
    });

    socket.on("user-disconnected", (userId) => {
      const peerObj = peersRef.current.find((p) => p.peerID === userId);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers(peersRef.current.map((p) => p.peer));
    });

    socket.on("user-joined", (payload) => {
      const peer = addPeer(payload.callerID, stream, true, payload.signal);
      peersRef.current.push({ peerID: payload.callerID, peer });
      setPeers((peers) => [...peers, peer]);
    });

    socket.on("receiving-returned-signal", (payload) => {
      const peerObj = peersRef.current.find((p) => p.peerID === payload.id);
      peerObj.peer.signal(payload.signal);
    });
  }, []);

  const addPeer = (userIdToSignal, stream, isInitiator = false, incomingSignal = null) => {
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      if (isInitiator) {
        socket.emit("sending-signal", { userToSignal: userIdToSignal, callerID: myId, signal });
      } else {
        socket.emit("returning-signal", { signal, callerID: userIdToSignal });
      }
    });

    peer.on("stream", (userVideoStream) => {
      setUsers((users) => [...users, userVideoStream]);
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    return peer;
  };

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
          <div className="mt-8">
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
