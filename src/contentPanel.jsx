/** @format */
import axios from "axios";
import { useState, useEffect, useCallback, useContext } from "react";

import { BackendContext } from "./main.jsx";
import PlotlyChart from "./components/plotlyGraph";
import PostTable from "./components/postTable";
import PropTypes from "prop-types";
import Summary from "./components/summary";

const filterAndSortPosts = (posts, dateRange) => {
	const [start, end] = dateRange;

	const filteredPostEntries = Object.entries(posts)
		.map(([key, post]) => {
			const date = new Date(post.created_utc * 1000);
			return { key, post, date };
		})
		.filter(({ date }) => {
			if (!start || !end) return true;
			return date >= start && date <= end;
		})
		.sort((a, b) => a.date - b.date);

	return filteredPostEntries.map(({ key }) => key);
};

const ContentPanel = ({
	userId,
	posts,
	isGenerating,
	onGenerate,
	summaryModel,
}) => {
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [summary, setSummary] = useState("");
	const [timelineId, setTimelineId] = useState("");
	const { backendAvailable } = useContext(BackendContext);

	const handleDateRangeChange = useCallback(
		(start, end) => {
			const dateRange = [start, end];
			const filteredAndSorted = filterAndSortPosts(posts, dateRange);
			setTimelineId(
				`${filteredAndSorted[0]}-${
					filteredAndSorted[filteredAndSorted.length - 1]
				}`
			);
			setSortedKeys(filteredAndSorted);
		},
		[posts]
	);

	// Initialize *once* when posts first arrive after changing user
	useEffect(() => {
		handleDateRangeChange(null, null);
	}, [posts, handleDateRangeChange]);

	// Load summary either from backend if available or from frontend data
	const loadSummary = useCallback(
		async (userId, timelineId, summaryModel) => {
			try {
				if (backendAvailable) {
					const res = await axios.get("/api/summary", {
						params: {
							user_id: userId,
							timeline_id: timelineId,
							model_name: summaryModel,
						},
					});
					setSummary(res.data.summary);
				} else {
					const res = await axios.get(`/data/${userId}_timelines.json`);
					const timelinedata = res.data;
					setSummary(
						timelinedata[timelineId]?.[`summary_${summaryModel}`] || ""
					);
				}
			} catch (e) {
				console.error("Failed to load summary:", e);
				setSummary("");
			}
		},
		[backendAvailable]
	);

	// Make sure to update summary if the model changes
	useEffect(() => {
		loadSummary(userId, timelineId, summaryModel);
	}, [loadSummary, summaryModel, timelineId, userId, isGenerating]);

	const onDelete = async () => {
		try {
			await axios.delete("/api/summary", {
				params: {
					user_id: userId,
					timeline_id: timelineId,
					model_name: summaryModel,
				},
			});
			// Reload summary
			loadSummary(userId, timelineId, summaryModel);
		} catch (error) {
			console.error("Deletion error:", error);
			alert(error);
		}
	};

	return (
		<>
			<div
				className="is-flex mb-4"
				style={{ flexBasis: "40%", minHeight: "40%", maxHeight: "40%" }}
			>
				<div
					className="box has-border is-flex-grow-2 mr-2"
					style={{
						position: "relative",
						flexBasis: "55%",
						overflowX: "scroll",
					}}
				>
					<Summary
						summary={summary}
						isGenerating={isGenerating}
						handleOnGenerate={() => onGenerate(sortedKeys, summaryModel)}
						handleOnDelete={onDelete}
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
				<div
					className="is-flex is-flex-direction-column box is-flex-grow-1 has-border ml-2"
					style={{ flexBasis: "45%" }}
				>
					<PlotlyChart
						userId={userId}
						posts={posts}
						onDateRangeChange={handleDateRangeChange}
					/>
				</div>
			</div>
			<div
				className="table-container box has-border"
				style={{ position: "relative", flexBasis: "60%", minHeight: 0 }}
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
		</>
	);
};

ContentPanel.propTypes = {
	userId: PropTypes.string.isRequired,
	posts: PropTypes.object.isRequired,
	isGenerating: PropTypes.bool.isRequired,
	onGenerate: PropTypes.func.isRequired,
	summaryModel: PropTypes.string.isRequired,
};

export default ContentPanel;
