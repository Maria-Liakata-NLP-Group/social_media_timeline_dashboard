/** @format */

import axios from "axios";
import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import Panel from "./panel.jsx";
import PostTable from "./postTable.jsx";
import FileUpload from "./fileUpload.jsx";
import PlotlyChart from "./plotlyGraph.jsx";
import filterAndSortPosts from "../helpers/sortPosts.jsx";

function AddDataPanel({ active, onClose }) {
	const [sessionId, setSessionId] = useState(null); // Track processing data on server with this id
	const [posts, setPosts] = useState({}); // Store posts after upload
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [timelinesOfInterest, setTimelinesOfInterest] = useState([]); // Store timelines after processing
	const [uploadMessage, setUploadMessage] = useState("");
	const [alpha, setAlpha] = useState(1);
	const [beta, setBeta] = useState(1);
	const [hazard, setHazard] = useState(1000);
	const [spanRadius, setSpanRadius] = useState(7);

	const handleDateRangeChange = useCallback(
		(start, end) => {
			const dateRange = [start, end];
			const filteredAndSorted = filterAndSortPosts(posts, dateRange);
			setSortedKeys(filteredAndSorted);
		},
		[posts]
	);

	// Initialize *once* when posts first arrive after upload
	useEffect(() => {
		handleDateRangeChange(null, null);
	}, [posts, handleDateRangeChange]);

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await axios.post("/api/upload-user-data", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			setUploadMessage(
				<span className="has-text-success ml-2">
					File <b>{file.name}</b> uploaded successfully
				</span>
			);
			console.log("Upload response:", response.data);
			setPosts(response.data["posts"]); // Set posts to the uploaded data
			setSessionId(response.data["session_id"]); // Set session ID
		} catch (error) {
			console.error("File upload error:", error);
			alert("Failed to upload file.");
		} finally {
			// Reset the file input
			event.target.value = null;
		}
	};

	const handleCreateTimelines = async () => {
		if (!sessionId) {
			alert("No session ID found. Please upload data first.");
			return;
		}
		try {
			const response = await axios.post("/api/create-timelines", {
				session_id: sessionId,
				method: "bocpd",
				alpha: alpha,
				beta: beta,
				hazard: hazard,
				span_radius: spanRadius,
			});
			setTimelinesOfInterest(response.data);
		} catch (error) {
			console.error("Error creating timelines:", error);
			alert("Failed to create timelines.");
		}
	};

	return (
		<div className={`modal ${active ? "is-active" : ""}`}>
			<div
				className="modal-background"
				onClick={onClose}
			></div>
			<div
				className="modal-content"
				style={{ width: "95%" }}
			>
				<Panel
					height="90vh"
					flexGrow={1}
				>
					<div
						style={{ display: "flex", flex: "0 0 auto", flexDirection: "row" }}
					>
						<FileUpload handleFileUpload={handleFileUpload} />
						<span>{uploadMessage}</span>
					</div>
					<div
						className="is-flex mb-4"
						style={{ flexBasis: "40%", minHeight: "40%", maxHeight: "40%" }}
					>
						<div
							style={{ width: "50%" }}
							className="is-flex is-flex-direction-column"
						>
							<h1 className="subtitle is-5 mb-5">Timeline Parameters</h1>
							<div className="mb-4">
								<input
									type="range"
									min="1"
									max="100"
									step="1"
									value={alpha}
									onChange={(e) => setAlpha(parseFloat(e.target.value))}
								/>
								<label className="ml-2">Alpha: {alpha}</label>
							</div>
							<div className="mb-4">
								<input
									type="range"
									min="1"
									max="100"
									step="1"
									value={beta}
									onChange={(e) => setBeta(parseFloat(e.target.value))}
								/>
								<label className="ml-2">Beta: {beta}</label>
							</div>
							<div className="mb-4">
								<input
									type="range"
									min="1"
									max="2000"
									step="1"
									value={hazard}
									onChange={(e) => setHazard(parseInt(e.target.value))}
								/>
								<label className="ml-2">Hazard: {hazard}</label>
							</div>
							<div className="mb-4">
								<input
									type="range"
									min="1"
									max="30"
									step="1"
									value={spanRadius}
									onChange={(e) => setSpanRadius(parseInt(e.target.value))}
								/>
								<label className="ml-2">Span Radius: {spanRadius}</label>
							</div>
							<div>
								<button
									className="button is-link mb-2"
									onClick={handleCreateTimelines}
								>
									Calculate Timelines
								</button>
							</div>
						</div>
						<div
							style={{
								flexBasis: 0,
								flexGrow: 1,
								flexShrink: 1,
								height: "100%",
								display: "flex",
							}}
							className="ml-2"
						>
							<PlotlyChart
								posts={posts}
								timelinesOfInterest={timelinesOfInterest}
								onDateRangeChange={handleDateRangeChange}
							/>
						</div>
					</div>
					<div
						className="table-container"
						style={{ position: "relative", flexBasis: "40%", minHeight: 0 }}
					>
						<PostTable
							posts={posts}
							filteredKeys={sortedKeys}
						/>
						{/* Create nice fade-out at bottom */}
						<div
							style={{
								position: "sticky",
								bottom: "-1.25em",
								left: 0,
								width: "100%",
								height: "1em",
								background: "linear-gradient(to top, white, transparent)",
							}}
						></div>
					</div>
				</Panel>
			</div>
		</div>
	);
}

AddDataPanel.propTypes = {
	active: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default AddDataPanel;
