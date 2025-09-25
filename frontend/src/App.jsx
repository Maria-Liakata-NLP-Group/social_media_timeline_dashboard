/** @format */

import axios from "axios";
import { useState, useEffect, useCallback, useContext } from "react";
import PropTypes from "prop-types";

import "./style.scss";
import ContentPanel from "./contentPanel";
import Panel from "./components/panel";
import AddDataPanel from "./components/addDataPanel.jsx";
import { BackendContext } from "./main.jsx";

const filterForTimelinesOfInterest = (timelines) => {
	return Object.values(timelines)
		.filter((timeline) => timeline.timeline_of_interest)
		.map((timeline) => timeline.posts);
};

function App({ userIds, reloadPage }) {
	const [userId, setUserId] = useState(userIds[0]);
	const [posts, setPosts] = useState({});
	const [timelinesOfInterest, setTimelinesOfInterest] = useState([]);
	const [isGenerating, setGen] = useState(false);
	const [summaryModel, setSummaryModel] = useState("tulu");
	const [showAddDataPanel, setShowAddDataPanel] = useState(false);

	const { backendAvailable } = useContext(BackendContext);

	const loadPosts = useCallback(async () => {
		// load posts from backend if available otherwise load it via frontend
		setPosts({});
		try {
			const url = backendAvailable
				? `/api/posts/${userId}`
				: `/data/${userId}_posts.json`;

			const { data } = await axios.get(url);
			setPosts(data);
		} catch (e) {
			console.error("Failed to load posts:", e);
		}
	}, [userId, backendAvailable]);

	// Get timelines of interest from backend if available
	const getTimelinesOfInterest = useCallback(async () => {
		setTimelinesOfInterest([]);
		if (backendAvailable) {
			try {
				const res = await axios.get(`/api/timelines-of-interest/${userId}`);
				setTimelinesOfInterest(res.data);
			} catch (e) {
				console.error("Failed to load timelines of interest:", e);
				setTimelinesOfInterest([]);
			}
		} else {
			try {
				// Fallback to frontend data
				const res = await axios.get(`/data/${userId}_timelines.json`);
				const toi = filterForTimelinesOfInterest(res.data);
				setTimelinesOfInterest(toi);
			} catch (e) {
				console.error(
					"Failed to load timelines of interest from frontend data:",
					e
				);
				setTimelinesOfInterest([]);
			}
		}
	}, [backendAvailable, userId]);

	useEffect(() => {
		loadPosts();
		getTimelinesOfInterest();
	}, [userId, loadPosts, getTimelinesOfInterest, backendAvailable]);

	// Handle opening and closing of the add data panel
	const handleCloseAddDataPanel = useCallback(
		(reload) => {
			setShowAddDataPanel(false);
			if (reload) {
				reloadPage(); // Reload user IDs in parent component
			}
		},
		[reloadPage]
	);

	const handleGenerate = async (postIds, modelName) => {
		setGen(true);

		try {
			const response = await axios.put("/api/generate-summary", {
				user_id: userId,
				posts_ids: postIds,
				model_name: modelName,
			});

			console.log("Generated summary for:", response.data.userid);
		} catch (error) {
			console.error("Generation error:", error);
			alert(error);
		} finally {
			setGen(false);
		}
	};

	return (
		<div className="is-flex root-container">
			<AddDataPanel
				active={showAddDataPanel}
				onClose={handleCloseAddDataPanel}
			/>
			<Panel
				flexGrow={1}
				height={"95vh"}
			>
				<div
					className="mb-4"
					style={{ display: "flex", flex: "0 0 auto", flexDirection: "row" }}
				>
					<div>
						<div className="is-flex is-align-items-center">
							<h1 className="subtitle is-5">Patient ID</h1>
							<button
								className="button is-small ml-2 is-link is-inverted"
								onClick={() => setShowAddDataPanel(true)}
								title="Add Data"
							>
								Add patient data
							</button>
						</div>
						<div className="select">
							<select onChange={(e) => setUserId(e.target.value)}>
								{userIds.map((id) => (
									<option
										key={id}
										value={id}
									>
										{id}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="ml-5">
						<h1 className="subtitle is-5">Summary Model</h1>
						<div className="tabs is-toggle">
							<ul>
								<li
									className={summaryModel === "tulu" ? "is-active" : ""}
									onClick={() => setSummaryModel("tulu")}
								>
									<a>
										<span>Tulu</span>
									</a>
								</li>
								<li
									className={
										summaryModel === "meta-llama/Meta-Llama-3.1-8B-Instruct"
											? "is-active"
											: ""
									}
									onClick={() =>
										setSummaryModel("meta-llama/Meta-Llama-3.1-8B-Instruct")
									}
								>
									<a>
										<span>LLama</span>
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<ContentPanel
					userId={userId}
					posts={posts}
					timelinesOfInterest={timelinesOfInterest}
					isGenerating={isGenerating}
					onGenerate={handleGenerate}
					summaryModel={summaryModel}
				/>
			</Panel>
		</div>
	);
}

App.propTypes = {
	userIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	reloadPage: PropTypes.func.isRequired,
};

export default App;
