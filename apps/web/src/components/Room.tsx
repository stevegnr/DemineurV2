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
  console.log("roomId", roomId);
  const [room, setRoom] = useState<RoomType | null>(null);
  const [grid, setGrid] = useState<GridType | null>(null);
  console.log("grid", grid);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const getRoom = async () => {
      try {
        const response = await fetch("http://localhost:3001/rooms/" + roomId, {
          method: "GET",
        });

        if (!response.ok) {
          console.error(`HTTP error! Status: ${response.status}`);
          return null;
        }

        const data: RoomType = await response.json();
        console.log("data", data);
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
    const args: newGrid = { height: 20, width: 20, bombs: 120, roomId };
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
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handlePlayMove = (cell: CellType) => {
    console.log("Move joué:", cell);
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

  // // Temporaire, récupérer la grille automatiquement
  // useEffect(() => {
  //   const getGrid = async () => {
  //     try {
  //       const response = await fetch("http://localhost:3001/grids/5", {
  //         method: "GET",
  //       });

  //       if (!response.ok) {
  //         console.error(`HTTP error! Status: ${response.status}`);
  //         return null;
  //       }

  //       const data: GridType = await response.json();
  //       setGrid(data);
  //     } catch (error) {
  //       console.error("Fetch error:", error);
  //     }
  //   };

  //   getGrid();
  // }, []);

  return (
    <div>
      <h2>{room ? "Salle : " + room.id : "Création de la salle"}</h2>
      <p>Lien : http://localhost5173/rooms/{roomId}</p>
      <Button onPress={createGrid}>Démarrer la partie</Button>
      {grid && (
        <Grid
          grid={grid}
          onPlayMove={handlePlayMove}
        />
      )}
    </div>
  );
}

export default Room;
