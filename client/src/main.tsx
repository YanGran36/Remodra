import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "ContractorHub - All-in-One Contractor Management Platform";

// Add favicon and meta tags
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'ContractorHub is an all-in-one platform for contractors to manage clients, estimates, invoices, projects, and materials.';
document.head.appendChild(meta);

createRoot(document.getElementById("root")!).render(<App />);
