import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoomCreation from './RoomCreation';
import VideoChat from './VideoChat';

function App() {
  return (

      <Routes>
        <Route path="/" element={<RoomCreation />} />
        <Route path="/video-chat/:roomId" element={<VideoChat />} />
      </Routes>

  );
}

export default App;
