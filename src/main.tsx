import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import TourHost from "./components/TourHost";
import { ModalProvider } from "./hooks/ModalContext";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import AppFrame from "./components/AppFrame.tsx";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppFrame>
        <HashRouter>
          <AuthProvider>
            <ModalProvider>
              <TourHost />
            </ModalProvider>
          </AuthProvider>
        </HashRouter>
      </AppFrame>
    </React.StrictMode>,
  );
}
