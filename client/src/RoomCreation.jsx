import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoomCreation = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8); // Simple room ID generation
    navigate(`/video-chat/${roomId}`, { state: { name } });
  };

  return (
    <div className="p-4 container mx-auto">
      <div className="flex justify-center items-center h-screen">
        <div>
          <input
            type="text"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 mb-4"
          />
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCreation;
