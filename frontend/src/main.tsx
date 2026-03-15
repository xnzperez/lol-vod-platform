import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sileo";
import App from "./App.tsx";
import "./index.css"; // O './App.css' dependiendo de cómo Vite haya nombrado tu archivo CSS global

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
