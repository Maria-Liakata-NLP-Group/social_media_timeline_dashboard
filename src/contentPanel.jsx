/** @format */

import PlotlyChart from "./components/plotlyGraph";
import PostTable from "./components/postTable";
import PropTypes from "prop-types";
import Summary from "./components/summary";
import { useState, useEffect, useCallback, useRef } from "react";

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
	timelines,
	isGenerating,
	onGenerate,
}) => {
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [summary, setSummary] = useState("");
	const [summaryModel, setSummaryModel] = useState("tulu");
	const [timelineId, setTimelineId] = useState("");

	// keep track of the last userId for which we ran initialization
	const lastInitUserId = useRef();

	const handleDateRangeChange = useCallback(
		(start, end) => {
			const dateRange = [start, end];
			const filteredAndSorted = filterAndSortPosts(posts, dateRange);
			setTimelineId(
				`${filteredAndSorted[0]}-${
					filteredAndSorted[filteredAndSorted.length - 1]
				}`
			);
			// setSummary(timelines[timelineId]?.[`summary_${summaryModel}`] || "");
			setSortedKeys(filteredAndSorted);
		},
		[posts]
	);

	// Initialize *once* when posts first arrive for a new userId
	useEffect(() => {
		if (userId !== lastInitUserId.current && Object.keys(posts).length) {
			handleDateRangeChange(null, null);
			lastInitUserId.current = userId;
		}
	}, [userId, posts, handleDateRangeChange]);

	// Make sure to update summary if the model changes
	useEffect(() => {
		setSummary(timelines[timelineId]?.[`summary_${summaryModel}`] || "");
	}, [summaryModel, timelines, timelineId]);

	return (
		<>
			<div
				className="is-flex mb-4"
				style={{ height: "40%" }}
			>
				<div
					className="box has-border is-flex-grow-2 mr-2"
					style={{
						position: "relative",
						flexBasis: "55%",
						overflowX: "scroll",
					}}
				>
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
					<Summary
						summary={summary}
						isGenerating={isGenerating}
						handleOnGenerate={() => onGenerate(sortedKeys, summaryModel)}
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
						timelines={timelines}
						onDateRangeChange={handleDateRangeChange}
					/>
				</div>
			</div>
			<div
				className="table-container box has-border"
				style={{ position: "relative", height: "60%" }}
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
	timelines: PropTypes.object.isRequired,
	isGenerating: PropTypes.bool.isRequired,
	onGenerate: PropTypes.func.isRequired,
};

export default ContentPanel;
