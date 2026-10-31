import { useState, useEffect } from "react";
import { Welcome } from "./components/welcome/Welcome";
import { WaitingRoom } from "./components/waiting-room/WaitingRoom";
import { Game } from "./components/game/Game";
import { UserScore } from "./components/user-score/UserScore";
import { Ranking } from "./components/ranking/Ranking";
import { ThankYou } from "./components/thank-you/ThankYou";
import { apiService } from "./services/apiService";
import { socketService } from "./services/socketService";
import type { Player, PlayerResult, ScreenType } from "./types";
import "./App.css";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("welcome");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    // Establish WebSocket connection
    socketService.connect();

    const savedId = localStorage.getItem("voidware_player_id");
    const savedName = localStorage.getItem("voidware_player_name");
    const savedSessionId = localStorage.getItem("voidware_session_id");

    if (savedId && savedName && savedSessionId) {
      const restoredPlayer: Player = {
        id: savedId,
        name: savedName,
        session_id: savedSessionId,
        joined_at: new Date().toISOString(),
      };
      setCurrentPlayer(restoredPlayer);

      // Check if this player already has a finished result
      const savedResultJson = localStorage.getItem(`voidware_result_${savedId}`);
      if (savedResultJson) {
        try {
          const res = JSON.parse(savedResultJson);
          setPlayerResult(res);
          setCurrentScreen("score");
          return;
        } catch {
          // ignore corrupted local storage
        }
      }

      // Check current session status with backend
      apiService
        .getSessionStatus()
        .then((session) => {
          if (session.status === "playing") {
            setCurrentScreen("game");
          } else {
            setCurrentScreen("waiting");
          }
        })
        .catch(() => {
          setCurrentScreen("waiting");
        });
    }
  }, []);

  // Handlers for navigation across the complete game flow
  const handleRegistered = (player: Player) => {
    setCurrentPlayer(player);
    setCurrentScreen("waiting");
  };

  const handleGameStart = () => {
    setCurrentScreen("game");
  };

  const handleFinishGame = (result: PlayerResult) => {
    setPlayerResult(result);
    setCurrentScreen("score");
  };

  const handleViewLeaderboard = () => {
    setCurrentScreen("ranking");
  };

  const handleNavigateThankYou = () => {
    setCurrentScreen("thankyou");
  };

  const handleAbort = () => {
    if (currentPlayer) {
      setCurrentScreen("waiting");
    } else {
      setCurrentScreen("welcome");
    }
  };

  const handleNewAttempt = () => {
    // Organizer allows another attempt or new operator
    localStorage.removeItem("voidware_player_id");
    localStorage.removeItem("voidware_player_name");
    localStorage.removeItem("voidware_session_id");
    setCurrentPlayer(null);
    setPlayerResult(null);
    setCurrentScreen("welcome");
  };

  return (
    <div className="void-app-root">
      {currentScreen === "welcome" && (
        <Welcome
          onRegistered={handleRegistered}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}

      {currentScreen === "waiting" && currentPlayer && (
        <WaitingRoom
          currentPlayer={currentPlayer}
          onGameStart={handleGameStart}
          onAbort={handleAbort}
          onNavigateLeaderboard={handleViewLeaderboard}
        />
      )}

      {currentScreen === "game" && currentPlayer && (
        <Game
          player={currentPlayer}
          onFinishGame={handleFinishGame}
          onAbort={handleAbort}
          onNavigateLeaderboard={handleViewLeaderboard}
        />
      )}

      {currentScreen === "score" && currentPlayer && (
        <UserScore
          player={currentPlayer}
          initialResult={playerResult}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}

      {currentScreen === "ranking" && (
        <Ranking
          currentPlayer={currentPlayer}
          onNavigateThankYou={handleNavigateThankYou}
          onBackToGame={currentPlayer ? () => setCurrentScreen("waiting") : undefined}
        />
      )}

      {currentScreen === "thankyou" && (
        <ThankYou
          currentPlayer={currentPlayer}
          onNavigateLeaderboard={handleViewLeaderboard}
          onRestart={handleNewAttempt}
        />
      )}
    </div>
  );
}
