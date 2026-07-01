import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Room from "./components/Room.tsx";
import App from "./App.tsx";

document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App />}
        />
        <Route
          path="/rooms/:roomId"
          element={<Room />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
