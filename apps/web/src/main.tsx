import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ReportDraftProvider } from "./context/ReportDraftContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReportDraftProvider>
          <App />
        </ReportDraftProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
