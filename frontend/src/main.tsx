import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./core/AuthContext";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "sileo"; // NUEVO: Importamos el contenedor visual

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Inyectamos el contexto de Supabase a nivel global */}
    <AuthProvider>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
