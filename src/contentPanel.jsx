/** @format */

import PlotlyChart from "./components/plotlyGraph";
import PostTable from "./components/postTable";
import PropTypes from "prop-types";
import Summary from "./components/summary";
import { useState, useEffect, useCallback } from "react";

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

const ContentPanel = ({ userId }) => {
	const [timelines, setTimelines] = useState({});
	const [posts, setPosts] = useState({});
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [summary, setSummary] = useState("");

	const loadData = useCallback(() => {
		Promise.all([
			fetch(`/data/${userId}_posts.json`).then((res) => res.json()),
			fetch(`/data/${userId}_timelines.json`).then((res) => res.json()),
		]).then(([postsData, timelinesData]) => {
			setSortedKeys([]);
			setPosts(postsData);
			setTimelines(timelinesData);
		});
	}, [userId]);

	const handleDateRangeChange = useCallback(
		(start, end) => {
			const dateRange = [start, end];
			const filteredAndSorted = filterAndSortPosts(posts, dateRange);
			const timelineId = `${filteredAndSorted[0]}-${filteredAndSorted[filteredAndSorted.length - 1]}`;
			setSummary(timelines[timelineId]?.summary || "");
			setSortedKeys(filteredAndSorted);
		},
		[posts, timelines]
	);

	const handleOnGenerationComplete = () => {
		console.log("Generation complete, reloading data...");
		loadData();
	};

	useEffect(() => {
		loadData();
	}, [loadData]);


	// Initialize sorted keys after loading
	useEffect(() => {
		if (Object.keys(posts).length && Object.keys(timelines).length) {
			handleDateRangeChange(null, null);
		}
	}, [posts, timelines, handleDateRangeChange]);

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
					<Summary summary={summary} userId={userId} postIds={sortedKeys} handleOnGenerationComplete={handleOnGenerationComplete}/>
				</div>
				<div
					className="is-flex is-flex-direction-column box is-flex-grow-1 has-border ml-2"
					style={{ flexBasis: "45%" }}
				>
					<PlotlyChart
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
};

export default ContentPanel;
