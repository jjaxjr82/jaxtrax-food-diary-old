import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "../supabaseClient"; // Initialize cookie sync

createRoot(document.getElementById("root")!).render(<App />);
