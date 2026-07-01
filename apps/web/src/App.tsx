import { Button } from "@heroui/react";
import { useState } from "react";
import type { GridType } from "./components/Grid";
import { useNavigate } from "react-router-dom";

export type RoomType = {
  id: string;
  mode: "1player" | "2players";
  grid?: GridType;
};

function App() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<"1player" | "2players">(
    "1player"
  );
  const [playerName, setPlayerName] = useState<string>(
    localStorage.getItem("playerName") ?? ""
  );
  const [currentRoomId] = useState<string | null>(
    () => localStorage.getItem("currentRoomId")
  );

  const handleCreateRoom = async () => {
    const name = playerName.trim() || "Invité";
    localStorage.setItem("playerName", name);

    try {
      const response = await fetch("http://localhost:3001/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }

      const data: RoomType = await response.json();
      navigate(`/rooms/${data.id}`);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Démineur</h1>

      <div className="flex flex-col gap-3 w-64">
        <label className="font-semibold text-sm">Ton pseudo :</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          placeholder="Invité"
          maxLength={20}
          className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold">Choisir le mode de jeu :</p>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedMode("1player")}
            className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
              selectedMode === "1player"
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-gray-400 bg-white text-gray-700 hover:border-blue-300"
            }`}>
            1 Joueur
          </button>
          <button
            onClick={() => setSelectedMode("2players")}
            className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
              selectedMode === "2players"
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-400 bg-white text-gray-700 hover:border-green-300"
            }`}>
            2 Joueurs
          </button>
        </div>
        {selectedMode === "2players" && (
          <p className="text-sm text-gray-500">
            Partage le lien de la salle avec un ami pour jouer ensemble.
            Trouver une bombe rapporte 1 point et permet de rejouer.
          </p>
        )}
        {selectedMode === "1player" && (
          <p className="text-sm text-gray-500">
            Ouvre toutes les cases sauf les bombes pour gagner.
          </p>
        )}
      </div>

      <Button onPress={handleCreateRoom}>Créer une salle</Button>

      {currentRoomId && (
        <button
          onClick={() => navigate(`/rooms/${currentRoomId}`)}
          className="text-sm text-gray-500 hover:text-gray-700 underline">
          Reprendre la partie en cours →
        </button>
      )}
    </div>
  );
}

export default App;
