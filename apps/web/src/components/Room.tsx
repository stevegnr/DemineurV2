import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { GridType } from "./Grid";
import Grid from "./Grid";
import { io, type Socket } from "socket.io-client";
import type { CellType } from "./Cell";

type newGrid = {
  height: number;
  width: number;
  bombs: number;
};

function Room() {
  const [grid, setGrid] = useState<GridType | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("gridUpdate", (updatedGrid) => setGrid(updatedGrid));

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGrid = async () => {
    const args: newGrid = { height: 30, width: 30, bombs: 20 };
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
        cellId: cell.id,
        x: cell.x,
        y: cell.y,
      });
    } else {
      console.warn("Socket non connecté");
    }
  };

  // Temporaire, récupérer la grille automatiquement
  useEffect(() => {
    const getGrid = async () => {
      try {
        const response = await fetch("http://localhost:3001/grids/5", {
          method: "GET",
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

    getGrid();
  }, []);

  return (
    <div>
      <Button onPress={createGrid}>Créer une grille</Button>
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
