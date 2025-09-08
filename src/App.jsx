/** @format */

import "./style.scss";
import ContentPanel from "./contentPanel";
import Panel from "./components/panel";
import userIds from "./assets/user_ids.json";
import { useState, useEffect, useCallback } from "react";

function App() {
	const [userId, setUserId] = useState(userIds.ids[0]);
	const [posts, setPosts] = useState({});
	const [timelines, setTimelines] = useState({});
	const [isGenerating, setGen] = useState(false);
	const [error, setError] = useState("");

	const loadData = useCallback(() => {
		Promise.all([
			fetch(`/data/${userId}_posts.json`).then((res) => res.json()),
			fetch(`/data/${userId}_timelines.json`).then((res) => res.json()),
		]).then(([postsData, timelinesData]) => {
			setPosts(postsData);
			setTimelines(timelinesData);
		});
	}, [userId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleGenerate = async (postIds, modelName) => {
		setGen(true);
		setError("");

		try {
			const resp = await fetch("/api/generate-summary", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					user_id: userId, // make sure userId is in scope
					posts_ids: postIds, // the array you pass in
					model_name: modelName, // the model name
				}),
			});

			// parse the JSON body (whether OK or error)
			const data = await resp.json();

			if (!resp.ok) {
				// if the server returned an error status, throw it
				throw new Error(data.error || resp.statusText);
			}

			// success! optionally log the returned user id:
			console.log("Generated summary for:", data.userid);

			// now reload your data so the new summary shows up:
			await loadData();
		} catch (e) {
			console.error("Generation error:", e);
			setError(e.message);
		} finally {
			loadData();
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
					style={{ flex: "0 0 auto" }}
				>
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
				<ContentPanel
					userId={userId}
					posts={posts}
					timelines={timelines}
					isGenerating={isGenerating}
					onGenerate={handleGenerate}
				/>
			</Panel>
		</div>
	);
}

export default App;
