import { Button } from "@heroui/react";
import type { GridType } from "./components/Grid";
import { useNavigate } from "react-router-dom";

export type RoomType = {
  id: string;
  grid?: GridType;
};

function App() {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const response = await fetch("http://localhost:3001/rooms", {
        method: "POST",
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
    <div>
      <Button onPress={handleCreateRoom}>Créer une salle</Button>
    </div>
  );
}

export default App;
