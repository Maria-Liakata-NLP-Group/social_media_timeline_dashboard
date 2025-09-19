/** @format */

import axios from "axios";
import { useState, useEffect, useCallback, useContext } from "react";

import "./style.scss";
import ContentPanel from "./contentPanel";
import Panel from "./components/panel";
import userIds from "./assets/user_ids.json";
import { BackendContext } from "./main.jsx";

function App() {
	const [userId, setUserId] = useState(userIds.ids[0]);
	const [posts, setPosts] = useState({});
	const [isGenerating, setGen] = useState(false);
	const [summaryModel, setSummaryModel] = useState("tulu");

	const { backendAvailable } = useContext(BackendContext);

	const loadPosts = useCallback(async () => {
		// load posts from backend if available otherwise load it via frontend
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

	useEffect(() => {
		loadPosts();
	}, [userId, loadPosts, backendAvailable]);

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
			<Panel
				flexGrow={1}
				height={"95vh"}
			>
				<div
					className="mb-4"
					style={{ display: "flex", flex: "0 0 auto", flexDirection: "row" }}
				>
					<div>
						<h1 className="subtitle is-5">Patient ID</h1>
						<div className="select">
							<select onChange={(e) => setUserId(e.target.value)}>
								{userIds.ids.map((id) => (
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
					isGenerating={isGenerating}
					onGenerate={handleGenerate}
					summaryModel={summaryModel}
				/>
			</Panel>
		</div>
	);
}

export default App;
