import { useState, useRef } from "react";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { DragonTimer } from "./features/player/DragonTimer";
import { Toaster } from "sileo";
import { useGameStats } from "./features/player/useGameStats";
import { useSmartUI } from "./features/player/useSmartUI";

import { RegisterForm } from "./features/auth/RegisterForm";

function App() {
  const { stats, updateServerTime } = useGameStats(
    "ws://localhost:8080/ws/stats",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isUIVisible = useSmartUI(isPlaying);

  const handleVideoTimeUpdate = (currentTime: number) => {
    updateServerTime(currentTime);
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  const fadeClass = `absolute inset-0 z-40 transition-opacity duration-700 ease-in-out ${
    isUIVisible ? "opacity-100" : "opacity-0"
  }`;

  // VERSIÓN DE PRUEBA: Solo renderizamos el formulario de registro.
  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-zinc-950">
      <RegisterForm />
    </div>
  );
}

export default App;
