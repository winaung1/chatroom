import React, { useState } from 'react';

const JoinChat = () => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  const handleJoin = () => {
    if (username && room) {
      console.log(`Username: ${username}`);
      console.log(`Room: ${room}`);
      // Here, you'd typically redirect to the chat room or handle the socket connection.
    } else {
      alert("Please enter a username and room name.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center mb-4">Join a Chat</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 mt-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter your username"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700">Room Name</label>
          <input 
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full px-3 py-2 mt-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter room name"
          />
        </div>

        <button
          onClick={handleJoin}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Join Chat
        </button>
      </div>
    </div>
  );
};

export default JoinChat;
