/** @format */

import { StrictMode, useState, useEffect, createContext } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";

// Track if the backend is available in all compontents (avoid prop drilling)
export const BackendContext = createContext({ backendAvailable: false });

function Main() {
	const [backendAvailable, setBackendAvailable] = useState(null);

	useEffect(() => {
		const checkBackend = async () => {
			try {
				await axios.get("/api/health-check");
				setBackendAvailable(true);
			} catch {
				setBackendAvailable(false);
			}
		};
		checkBackend();
	}, []);

	if (backendAvailable === null) {
		return <div>Loading...</div>;
	} else {
		return (
			<BackendContext.Provider value={{ backendAvailable }}>
				<App />
			</BackendContext.Provider>
		);
	}
}

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<Main />
	</StrictMode>
);
