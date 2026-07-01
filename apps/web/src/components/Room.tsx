import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { GridType } from "./Grid";
import Grid from "./Grid";
import { io, type Socket } from "socket.io-client";
import type { CellType } from "./Cell";
import type { RoomType } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import { updateGrid } from "../utils/room";

type newGrid = {
  height: number;
  width: number;
  bombs: number;
  roomId: string;
};

type UpdatedPlayersPayload = { id: string; name: string }[];

type Player = { id: string; name: string };

type GameWonPayload = {
  mode: "1player" | "2players";
  scores: Record<string, number>;
  winner: string | null;
};

function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<GridType | null>(null);
  const [flaggedCells, setFlaggedCells] = useState<CellType[]>([]);
  const [lastCellsPlayed, setLastCellsPlayed] = useState<
    { x: number; y: number }[]
  >([{ x: 0, y: 0 }]);
  const [gameOver, setGameOver] = useState<boolean>(true);

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gameWonData, setGameWonData] = useState<GameWonPayload | null>(null);
  const [editingName, setEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const getRoom = async () => {
      try {
        const response: Response = await fetch(
          "http://localhost:3001/rooms/" + roomId,
          { method: "GET" }
        );

        if (!response.ok) {
          console.error(`HTTP error! Status: ${response.status}`);
          return null;
        }

        const data: RoomType = await response.json();
        if (data.grid) {
          setGameOver(data.grid.isGameOver);
          if (data.grid.cells && data.grid.cells.length > 0) {
            setGrid(data.grid);
          }
        }
        setRoom(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    getRoom();
  }, [roomId]);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      setMyPlayerId(socket.id ?? null);
      const playerName = localStorage.getItem("playerName") ?? "Invité";
      socket.emit("joinRoom", { roomId, playerName });
    });

    socket.on("updatedPlayers", (payload: UpdatedPlayersPayload) => {
      setPlayers(payload);
    });

    socket.on(
      "gameState",
      (payload: {
        mode: "1player" | "2players";
        currentTurn: string | null;
        scores: Record<string, number>;
      }) => {
        setCurrentTurn(payload.currentTurn);
        setScores(payload.scores);
        // Sync mode from server in case room state wasn't loaded yet
        setRoom((prev) =>
          prev ? { ...prev, mode: payload.mode } : prev
        );
      }
    );

    socket.on("updatedGrid", (payload) => {
      if (payload.isGameOver || payload.isWin) setGameOver(true);
      if (payload.currentTurn !== undefined) setCurrentTurn(payload.currentTurn);
      if (payload.scores !== undefined) setScores(payload.scores);
      setGrid((currentGrid) => {
        if (!currentGrid) return currentGrid;
        return updateGrid(currentGrid, payload.openedCells);
      });
    });

    socket.on("gameStarted", ({ grid }: { grid: GridType }) => {
      setGrid(grid);
      setGameOver(false);
      setFlaggedCells([]);
      setGameWonData(null);
      setLastCellsPlayed([{ x: 0, y: 0 }]);
    });

    socket.on("gameWon", (payload: GameWonPayload) => {
      setGameWonData(payload);
      setGameOver(true);
    });

    socket.on("joinRejected", ({ reason }: { reason: string }) => {
      alert(`Impossible de rejoindre la salle : ${reason}`);
      navigate("/");
    });

    const handleBeforeUnload = () => {
      socket.emit("leaveRoom", { roomId });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.emit("leaveRoom", { roomId });
      socket.disconnect();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId, navigate]);

  const createGrid = async () => {
    if (!roomId) return;
    const args: newGrid = { height: 20, width: 20, bombs: 80, roomId };
    try {
      const response = await fetch("http://localhost:3001/grids", {
        method: "POST",
        body: JSON.stringify(args),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }

      const data: GridType = await response.json();

      // Mise à jour locale immédiate (fallback si socket momentanément déconnecté)
      setGrid(data);
      setGameOver(false);
      setFlaggedCells([]);
      setGameWonData(null);
      setLastCellsPlayed([{ x: 0, y: 0 }]);

      // Diffuse la grille à tous les joueurs de la salle (synchronise le gridId)
      socketRef.current?.emit("newGame", { roomId, grid: data });
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handlePlayMoves = (cells: CellType[]) => {
    if (gameOver) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("playMoves", {
        cells,
        gridId: grid!.id,
        roomId: room!.id,
      });

      setLastCellsPlayed(cells.map((c) => ({ x: c.x, y: c.y })));
    } else {
      console.warn("Socket non connecté");
    }
  };

  const mode = room?.mode ?? "1player";
  const is2Player = mode === "2players";

  const isMyTurn =
    !is2Player ||
    (players.length >= 2 && myPlayerId === currentTurn);

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? "Joueur inconnu";

  const handleRename = () => {
    const name = nameInput.trim();
    if (!name || !roomId) return;
    localStorage.setItem("playerName", name);
    socketRef.current?.emit("renamePlayer", { roomId, name });
    setEditingName(false);
  };

  return (
    <div className="flex gap-6 p-4">
      <div className="flex flex-col gap-3 min-w-48">
        <h2 className="font-bold text-lg">
          {room ? "Salle : " + room.id.slice(0, 8) + "…" : "Chargement…"}
        </h2>

        <div className="text-sm">
          <span
            className={`inline-block px-2 py-0.5 rounded font-semibold ${
              is2Player
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
            {is2Player ? "2 Joueurs" : "1 Joueur"}
          </span>
        </div>

        <div>
          <p className="font-semibold text-sm mb-1">Joueurs :</p>
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex justify-between items-center text-sm px-2 py-1 rounded ${
                is2Player && currentTurn === p.id
                  ? "bg-yellow-100 font-bold"
                  : ""
              }`}>
              {p.id === myPlayerId && editingName ? (
                <form
                  className="flex items-center gap-1 flex-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename();
                  }}>
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingName(false)}
                    maxLength={20}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs flex-1 min-w-0"
                  />
                  <button type="submit" className="text-green-600 px-1">✓</button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="text-gray-400 px-1">
                    ✕
                  </button>
                </form>
              ) : (
                <span className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="truncate">
                    {p.name}
                    {is2Player && currentTurn === p.id && " ▶"}
                  </span>
                  {p.id === myPlayerId && (
                    <button
                      onClick={() => {
                        setNameInput(p.name);
                        setEditingName(true);
                      }}
                      title="Changer mon pseudo"
                      className="text-gray-400 hover:text-gray-600 text-xs shrink-0">
                      ✏️
                    </button>
                  )}
                </span>
              )}
              {is2Player && (
                <span className="ml-2 text-purple-700 font-bold shrink-0">
                  {scores[p.id] ?? 0} pts
                </span>
              )}
            </div>
          ))}
        </div>

        {is2Player && players.length < 2 && (
          <p className="text-sm text-gray-500">
            En attente d'un second joueur…
            <br />
            Partage le lien :{" "}
            <span className="font-mono text-xs break-all">
              http://localhost:5173/rooms/{roomId}
            </span>
          </p>
        )}

        {is2Player && players.length >= 2 && !gameOver && (
          <p className="text-sm font-semibold">
            {isMyTurn ? "C'est ton tour !" : `Tour de ${getPlayerName(currentTurn ?? "")}`}
          </p>
        )}

        {gameWonData && (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm">
            <p className="font-bold text-lg mb-1">
              {gameWonData.mode === "1player"
                ? "🎉 Victoire !"
                : gameWonData.winner === myPlayerId
                ? "🏆 Tu as gagné !"
                : gameWonData.winner === null
                ? "🤝 Égalité !"
                : `🏆 ${getPlayerName(gameWonData.winner)} a gagné !`}
            </p>
            {gameWonData.mode === "2players" && (
              <div>
                {Object.entries(gameWonData.scores).map(([id, score]) => (
                  <p key={id}>
                    {getPlayerName(id)} : {score} pts
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {gameOver && <Button onPress={createGrid}>Démarrer la partie</Button>}
      </div>

      {grid && (
        <Grid
          grid={grid}
          onPlayMove={handlePlayMoves}
          flaggedCells={flaggedCells}
          setFlaggedCells={setFlaggedCells}
          lastCellsPlayed={lastCellsPlayed}
          disabled={!isMyTurn || gameOver}
        />
      )}
    </div>
  );
}

export default Room;
