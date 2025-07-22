import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { GridType } from "./Grid";
import Grid from "./Grid";
import { io, type Socket } from "socket.io-client";
import type { CellType } from "./Cell";
import type { RoomType } from "../App";
import { useParams } from "react-router-dom";
import { updateGrid } from "../utils/room";

type newGrid = {
  height: number;
  width: number;
  bombs: number;
  roomId: string;
};

type UpdatedPlayersPayload = { id: string; name: string }[];

type Player = { id: string; name: string };

function Room() {
  const { roomId } = useParams<{ roomId: string }>();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<GridType | null>(null);
  const [flaggedCells, setFlaggedCells] = useState<CellType[]>([]);
  const [lastCellsPlayed, setLastCellsPlayed] = useState<
    {
      x: number;
      y: number;
    }[]
  >([{ x: 0, y: 0 }]);

  const [gameOver, setGameOver] = useState<boolean>(true);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const getRoom = async () => {
      try {
        const response: Response = await fetch(
          "http://localhost:3001/rooms/" + roomId,
          {
            method: "GET",
          }
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

    // Rejoindre une salle
    socket.emit("joinRoom", { roomId });

    // Écouter les MAJs des joueurs
    socket.on("updatedPlayers", (payload: UpdatedPlayersPayload) => {
      setPlayers(payload);
    });

    // Écouter les MAJs de la grille
    socket.on("updatedGrid", (payload) => {
      if (payload.isGameOver) setGameOver(true);
      setGrid((currentGrid) => {
        if (!currentGrid) return currentGrid;
        return updateGrid(currentGrid, payload.openedCells);
      });
    });

    // 👉 Déconnexion propre si l'onglet ferme
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom", { roomId });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.emit("leaveRoom", { roomId });
      socket.disconnect();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId]);

  const createGrid = async () => {
    if (!roomId) return;
    const args: newGrid = { height: 20, width: 20, bombs: 90, roomId };
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
      setGrid(data);
      setGameOver(false);
      setFlaggedCells([]);
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

      const lastPlayed: { x: number; y: number }[] = cells.map((c) => {
        return {
          x: c.x,
          y: c.y,
        };
      });
      setLastCellsPlayed(lastPlayed);
    } else {
      console.warn("Socket non connecté");
    }
  };

  return (
    <div className="flex">
      <div>
        <h2>{room ? "Salle : " + room.id : "Création de la salle"}</h2>
        {players?.map((p) => (
          <p key={p.id}>{p.name}</p>
        ))}
        <p>Lien : http://localhost5173/rooms/{roomId}</p>
        {gameOver && <Button onPress={createGrid}>Démarrer la partie</Button>}
      </div>
      {grid && (
        <Grid
          grid={grid}
          onPlayMove={handlePlayMoves}
          flaggedCells={flaggedCells}
          setFlaggedCells={setFlaggedCells}
          lastCellsPlayed={lastCellsPlayed}
        />
      )}
    </div>
  );
}

export default Room;
