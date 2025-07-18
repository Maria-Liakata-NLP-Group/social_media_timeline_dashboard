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

	// keep track of the last userId for which we ran initialization
	const lastInitUserId = useRef();

	const handleDateRangeChange = useCallback(
		(start, end) => {
			const dateRange = [start, end];
			const filteredAndSorted = filterAndSortPosts(posts, dateRange);
			const timelineId = `${filteredAndSorted[0]}-${
				filteredAndSorted[filteredAndSorted.length - 1]
			}`;
			setSummary(timelines[timelineId]?.summary || "");
			setSortedKeys(filteredAndSorted);
		},
		[posts, timelines]
	);

	// Initialize *once* when posts first arrive for a new userId
	useEffect(() => {
		if (userId !== lastInitUserId.current && Object.keys(posts).length) {
			handleDateRangeChange(null, null);
			lastInitUserId.current = userId;
		}
	}, [userId, posts, handleDateRangeChange]);

	return (
		<>
			<div
				className="is-flex mb-4"
				style={{ flex: "0 0 40%" }}
			>
				<div
					className="box has-border is-flex-grow-2 mr-2"
					style={{ flexBasis: "55%", overflowX: "scroll" }}
				>
					<Summary
						summary={summary}
						isGenerating={isGenerating}
						handleOnGenerate={() => onGenerate(sortedKeys)}
					/>
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
				style={{ flex: "1 1 auto" }}
			>
				<PostTable
					posts={posts}
					filteredKeys={sortedKeys}
				/>
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
