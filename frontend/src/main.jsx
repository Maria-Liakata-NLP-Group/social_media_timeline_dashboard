/** @format */

import {
	StrictMode,
	useState,
	useEffect,
	useCallback,
	createContext,
} from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";

// Track if the backend is available in all compontents (avoid prop drilling)
export const BackendContext = createContext({ backendAvailable: false });

function Main() {
	const [backendAvailable, setBackendAvailable] = useState(null);
	const [userIds, setUserIds] = useState(null);

	// Check backend health
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

	// Load user IDs only after backendAvailable is known
	useEffect(() => {
		if (backendAvailable === null) return; // don’t run too early
		if (userIds !== null) return; // don’t reload if already loaded

		const loadUserIds = async () => {
			try {
				const url = backendAvailable ? "/api/user_ids" : "/data/user_ids.json";
				const { data } = await axios.get(url);
				console.log("Loaded user IDs:", data);
				setUserIds(data);
			} catch (e) {
				console.error("Failed to load user IDs:", e);
			}
		};

		loadUserIds();
	}, [backendAvailable, userIds]);

	// Reload user Ids when new patient data was added, this is done by setting userIds to null and retriggering the useEffect above
	const reloadUserIds = useCallback(() => setUserIds(null), []);

	// Render fallback until ready
	if (backendAvailable === null || userIds === null) {
		return <div>Loading...</div>;
	}

	return (
		<BackendContext.Provider value={{ backendAvailable }}>
			<App
				userIds={userIds}
				reloadPage={reloadUserIds}
			/>
		</BackendContext.Provider>
	);
}

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<Main />
	</StrictMode>
);
