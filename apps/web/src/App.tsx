import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import Grid from "./components/Grid";

type newGrid = {
  height: number;
  width: number;
  bombs: number;
};

function App() {
  const [grid, setGrid] = useState<Grid | null>(null);
  const createGrid = async () => {
    const args: newGrid = { height: 20, width: 20, bombs: 20 };
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

      const data: Grid = await response.json();
      setGrid(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

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

        const data: Grid = await response.json();
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
      {grid && <Grid grid={grid} />}
    </div>
  );
}

export default App;
