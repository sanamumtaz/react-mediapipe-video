import "./App.css";
import React, { useState } from "react";
import { AlterBackground } from "./components/AlterBackground";
import { FaceFilter } from "./components/FaceFilter";

function App() {
  const [isBgMode, setIsBgMode] = useState(true);

  return (
    <div className="App">
      <h2>Mediapipe Implementation</h2>
      Switch to Mode:{" "}
      <button onClick={() => setIsBgMode(!isBgMode)}>
        {isBgMode ? "Face Filter" : "Background Manipulation"}
      </button>
      <br />
      <br />
      {isBgMode ? <AlterBackground /> : <FaceFilter />}
    </div>
  );
}

export default App;
