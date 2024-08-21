import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import VideoChat from './VideoChat';

const App = () => {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [shareableLink, setShareableLink] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('roomId');
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
      setInRoom(true);
    }
  }, []);

  const createOrJoinRoom = () => {
    if (!roomId) {
      const newRoomId = uuidv4();
      setRoomId(newRoomId);
      setShareableLink(`${window.location.origin}?roomId=${newRoomId}`);
    } else {
      setShareableLink(`${window.location.origin}?roomId=${roomId}`);
    }
    setInRoom(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!inRoom ? (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center mb-4">Join or Create a Room</h2>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID (or leave empty to create)"
            className="w-full px-3 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            onClick={createOrJoinRoom}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            {roomId ? 'Join Room' : 'Create Room'}
          </button>
          {shareableLink && (
            <div className="mt-4 text-center">
              <p className="text-sm">Share this link to invite others:</p>
              <a
                href={shareableLink}
                className="text-blue-500 underline break-words"
              >
                {shareableLink}
                sasdasdsa
              </a>
            </div>
          )}
        </div>
      ) : (
        <VideoChat roomId={roomId} />
      )}
    </div>
  );
};

export default App;
