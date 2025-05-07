/** @format */

import Panel from "./components/panel";
import PlotlyChart from "./components/plotlyGraph";
import PostTable from "./components/postTable";
import PropTypes from "prop-types";
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

const ContentPanel = ({ userIds }) => {
	const [userId, setUserId] = useState(userIds[0]);
	const [timelines, setTimelines] = useState({});
	const [posts, setPosts] = useState({});
	const [sortedKeys, setSortedKeys] = useState([]); // sorted keys for post dictionary
	const [summary, setSummary] = useState("");

	// Load both posts and timelines together
	useEffect(() => {
		Promise.all([
			fetch(`/data/${userId}_posts.json`).then((res) => res.json()),
			fetch(`/data/${userId}_timelines.json`).then((res) => res.json()),
		]).then(([postsData, timelinesData]) => {
			setPosts(postsData);
			setTimelines(timelinesData);
		});
	}, [userId]);

	// Memoized date range handler
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

	// Initialize sorted keys after loading
	useEffect(() => {
		if (Object.keys(posts).length && Object.keys(timelines).length) {
			handleDateRangeChange(null, null);
		}
	}, [posts, timelines, handleDateRangeChange]);

	return (
		<Panel
			flexGrow={1}
			height={"95vh"}
		>
			<div
				className="mb-4"
				style={{ flex: "0 0 auto" }}
			>
				<h1 className="subtitle is-5">Client ID</h1>
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
			<div
				className="is-flex mb-4"
				style={{ flex: "0 0 40%" }}
			>
				<div
					className="box has-border is-flex-grow-2 mr-2"
					style={{ flexBasis: "55%", overflowX: "scroll" }}
				>
					<h2 className="subtitle is-4">Summary</h2>
					{summary}
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
		</Panel>
	);
};

ContentPanel.propTypes = {
	userIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ContentPanel;
