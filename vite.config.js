/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			// any request starting with /api/ will be forwarded to Flask
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
});
