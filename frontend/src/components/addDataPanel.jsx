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
	const [alpha, setAlpha] = useState(0.01);
	const [beta, setBeta] = useState(10);
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

	const handleSaveData = async () => {
		if (!sessionId) {
			alert("No session ID found. Please upload data first.");
			return;
		}
		try {
			const res = await axios.post("/api/save-user-data/", {
				session_id: sessionId,
			});
			console.log(res.data);
		} catch (error) {
			console.error("Error saving data:", error);
			alert("Failed to save data.");
		}
		onClose(true); // Close panel and signal to reload data in parent
	};

	const handleCloseWithoutSave = () => {
		// send signal to backend to delete session data
		if (sessionId) {
			axios.delete("/api/delete-session/", { data: { session_id: sessionId } });
		}
		onClose(false); // Close panel without saving
	};

	return (
		<div className={`modal ${active ? "is-active" : ""}`}>
			<div
				className="modal-background"
				onClick={handleCloseWithoutSave}
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
						className="is-flex is-justify-content-space-between mb-4"
						style={{ width: "100%", flexBasis: "60%" }}
					>
						<div className="is-flex is-flex-direction-column">
							<div className="is-flex is-flex-direction-row mb-4">
								<FileUpload handleFileUpload={handleFileUpload} />
								<span>{uploadMessage}</span>
							</div>
							<div className="is-flex is-flex-direction-row is-align-items-stretch">
								<div
									className="is-flex is-flex-direction-column is-flex-grow-1"
									style={{ minHeight: "100%" }}
								>
									<h1 className="subtitle is-5 mb-5">Timeline Parameters</h1>
									<div className="mb-4">
										<input
											type="range"
											min="0"
											max="10"
											step="0.01"
											value={alpha}
											onChange={(e) => setAlpha(parseFloat(e.target.value))}
										/>
										<label className="ml-2">Alpha: {alpha}</label>
									</div>
									<div className="mb-4">
										<input
											type="range"
											min="0"
											max="10"
											step="0.01"
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
									<div className="mt-auto">
										<button
											className="button is-link is-small mb-2"
											onClick={handleCreateTimelines}
										>
											Calculate Timelines
										</button>
									</div>
								</div>
								<div
									className="is-flex is-flex-direction-column ml-6 is-flex-grow-1"
									style={{ minHeight: "100%" }}
								>
									<h1 className="subtitle is-5 mb-5">
										Moments of Change Parameters
									</h1>
									<div className="mb-4">
										<input
											type="range"
											min="0"
											max="10"
											step="0.01"
											value={0}
											onChange={() => null}
										/>
										<label className="ml-2">Para 1: </label>
									</div>
									<div className="mb-4">
										<input
											type="range"
											min="0"
											max="10"
											step="0.01"
											value={0}
											onChange={() => null}
										/>
										<label className="ml-2">Para 2:</label>
									</div>
									<div className="mt-auto">
										<button
											className="button is-link is-small mb-2"
											onClick={() => null} //TODO: implement
										>
											Calculate Moments of Change
										</button>
									</div>
								</div>
							</div>
							<div className="is-flex-grow-1 is-flex is-align-items-center">
								<button
									className="button is-success"
									onClick={handleSaveData}
								>
									Save new patient data
								</button>
							</div>
						</div>
						<div
							className="is-flex-grow-1 ml-2"
							style={{ maxWidth: "50%" }}
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
