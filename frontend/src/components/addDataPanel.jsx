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
	const [progress, setProgress] = useState(0); // Track steps in the timeline creation pipeline
	const [sessionId, setSessionId] = useState(null); // Track processing data on server with this id
	const [posts, setPosts] = useState({}); // Store posts after upload
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [timelinesOfInterest, setTimelinesOfInterest] = useState([]); // Store timelines after processing
	const [timelinesLoading, setTimelinesLoading] = useState(false); // Loading state for timelines
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
			setUploadMessage(<span className="ml-2">Uploading...</span>);
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
			setProgress(1); // Move to next step
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
			setTimelinesLoading(true);
			const response = await axios.post("/api/create-timelines", {
				session_id: sessionId,
				method: "bocpd",
				alpha: alpha,
				beta: beta,
				hazard: hazard,
				span_radius: spanRadius,
			});
			setTimelinesOfInterest(response.data);
			setProgress(3); // TODO: change to 2 once moments of change is implemented
		} catch (error) {
			console.error("Error creating timelines:", error);
			alert("Failed to create timelines.");
		} finally {
			setTimelinesLoading(false);
		}
	};
	// Reset all states when panel is closed
	const resetStates = () => {
		console.log("Resetting AddDataPanel state");
		setProgress(0);
		setSessionId(null);
		setPosts({});
		setSortedKeys([]);
		setTimelinesOfInterest([]);
		setTimelinesLoading(false);
		setUploadMessage("");
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
		resetStates();
		onClose(true); // Close panel and signal to reload data in parent
	};

	const handleCloseWithoutSave = () => {
		// send signal to backend to delete session data
		if (sessionId) {
			axios.delete("/api/delete-session/", { data: { session_id: sessionId } });
		}
		resetStates();
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
					position="relative"
				>
					<span
						className="icon is-clickable"
						onClick={handleCloseWithoutSave}
						style={{
							position: "absolute",
							top: "10px",
							right: "10px",
							zIndex: 10,
						}}
					>
						<i className="fa-solid fa-xmark"></i>
					</span>
					<div
						className="is-flex is-justify-content-space-between mb-4"
						style={{ width: "100%", flexBasis: "60%" }}
					>
						<div className="is-flex is-flex-direction-column">
							<div className="is-flex is-flex-direction-row is-align-items-center mb-4">
								<span className="icon mr-2">
									<i className="fa-solid fa-1"></i>
								</span>
								<FileUpload handleFileUpload={handleFileUpload} />
								<span>{uploadMessage}</span>
							</div>
							<div className="is-flex is-flex-direction-row is-align-items-stretch">
								<div
									className={`section-wrapper ${
										progress < 1 ? "is-disabled" : ""
									}`}
								>
									<span className="icon mr-2">
										<i className="fa-solid fa-2"></i>
									</span>
								</div>
								<div
									className={`is-flex is-flex-direction-column is-flex-grow-1 section-wrapper ${
										progress < 1 ? "is-disabled" : ""
									}`}
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
										<label className="ml-2">
											Alpha:{" "}
											<span className="value-label">{alpha.toFixed(2)}</span>
										</label>
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
										<label className="ml-2">
											Beta:{" "}
											<span className="value-label">{beta.toFixed(2)}</span>
										</label>
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
										<label className="ml-2">
											Hazard: <span className="value-label">{hazard}</span>
										</label>
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
										<label className="ml-2">
											Span Radius:{" "}
											<span className="value-label">{spanRadius}</span>
										</label>
									</div>
									<div className="mt-auto">
										<button
											className={`button is-link is-small mb-2 ${
												timelinesLoading ? "is-loading" : ""
											}`}
											disabled={timelinesLoading}
											onClick={handleCreateTimelines}
										>
											Calculate Timelines
										</button>
									</div>
								</div>
								{/* TODO: remove the constant is-disabled once implemented */}
								<div
									className={`ml-4 section-wrapper is-disabled ${
										progress < 2 ? "is-disabled" : ""
									}`}
								>
									<span className="icon mr-2">
										<i className="fa-solid fa-3"></i>
									</span>
								</div>
								<div
									className={`is-flex is-flex-direction-column is-flex-grow-1 section-wrapper is-disabled ${
										progress < 2 ? "is-disabled" : ""
									}`}
									style={{ minHeight: "100%" }}
								>
									<h1 className="subtitle is-5 mb-5">
										<s>Moments of Change Parameters</s>
										<br />
										<span className="has-text-danger is-size-6">
											{" "}
											(Coming Soon)
										</span>
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
							<div
								className={`is-flex-grow-1 is-flex is-align-items-center section-wrapper ${
									progress < 3 ? "is-disabled" : ""
								}`}
							>
								<div>
									<span className="icon mr-2">
										<i className="fa-solid fa-4"></i>
									</span>
								</div>
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
							{progress > 0 ? (
								<PlotlyChart
									posts={posts}
									timelinesOfInterest={timelinesOfInterest}
									onDateRangeChange={handleDateRangeChange}
								/>
							) : (
								""
							)}
						</div>
					</div>
					<div
						className="table-container"
						style={{ position: "relative", flexBasis: "40%", minHeight: 0 }}
					>
						{progress > 0 ? (
							<PostTable
								posts={posts}
								filteredKeys={sortedKeys}
							/>
						) : (
							""
						)}
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
