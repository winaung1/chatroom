import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import VideoChat from "./VideoChat";

const App = () => {


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <VideoChat />
    </div>
  );
};

export default App;
