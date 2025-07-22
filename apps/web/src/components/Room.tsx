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

function Room() {
  const { roomId } = useParams<{ roomId: string }>();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [grid, setGrid] = useState<GridType | null>(null);
  const [flaggedCells, setFlaggedCells] = useState<CellType[]>([]);

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
        if (data.grid?.cells && data.grid.cells.length > 0) {
          console.log("grid!", data.grid);
          setGrid(data.grid);
          setGameOver(false);
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

    // Écouter les MAJs de la grille
    socket.on("updatedGrid", (payload) => {
      if (payload.isGameOver) setGameOver(true);
      setGrid((currentGrid) => {
        if (!currentGrid) return currentGrid;
        return updateGrid(currentGrid, payload.openedCells);
      });
    });

    return () => {
      socket.disconnect();
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

  const handlePlayMove = (cell: CellType) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("playMove", {
        cell: { x: cell.x, y: cell.y },
        gridId: grid!.id,
        roomId: room!.id,
      });
    } else {
      console.warn("Socket non connecté");
    }
  };

  console.log("gameOver", gameOver);

  return (
    <div>
      <h2>{room ? "Salle : " + room.id : "Création de la salle"}</h2>
      <p>Lien : http://localhost5173/rooms/{roomId}</p>
      {gameOver && <Button onPress={createGrid}>Démarrer la partie</Button>}
      {grid && (
        <Grid
          grid={grid}
          onPlayMove={handlePlayMove}
          flaggedCells={flaggedCells}
          setFlaggedCells={setFlaggedCells}
        />
      )}
    </div>
  );
}

export default Room;
