/** @format */

import Plot from "react-plotly.js";
import PropTypes from "prop-types";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";

const legendTraces = [
	{
		x: [null],
		y: [null],
		mode: "lines",
		name: "Moments of Change",
		line: {
			color: "rgba(255, 0, 0, 0.7)",
			width: 2,
			dash: "solid",
		},
		hoverinfo: "skip",
	},
	{
		x: [null],
		y: [null],
		mode: "lines",
		name: "Timelines of Interest",
		line: {
			color: "rgba(255, 0, 0, 0.3)",
			width: 10,
		},
		hoverinfo: "skip",
	},
];

const PlotlyChart = ({ userId, posts, timelines, onDateRangeChange }) => {
	const [zoomRange, setZoomRange] = useState(null);
	const [binSize, setBinSize] = useState("M1");

	const timestamps = useMemo(
		() =>
			Object.values(posts).map((post) =>
				new Date(post.created_utc * 1000).toISOString()
			),
		[posts]
	);

	// 1) Keep a ref of the *latest* posts
	const postsRef = useRef(posts);
	useEffect(() => {
		postsRef.current = posts;
	}, [posts]);

	// 2) Compute initialZoomRange only when userId changes

	const initialZoomRange = useMemo(() => {
		const snap = postsRef.current; // read the snapshot
		const dates = Object.values(snap).map(
			(p) => new Date(p.created_utc * 1000)
		);
		if (dates.length === 0) return null;
		const minDate = new Date(Math.min(...dates));
		const maxDate = new Date(Math.max(...dates));
		return [minDate.toISOString(), maxDate.toISOString()];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId]);

	const shapes = useMemo(() => {
		return Object.values(timelines).flatMap((timeline) => {
			const first = posts[timeline.posts[0]];
			const last = posts[timeline.posts.at(-1)];
			if (!first || !last || !timeline.timeline_of_interest) return [];

			const start = new Date(first.created_utc * 1000);
			const end = new Date(last.created_utc * 1000);

			return [
				{
					type: "rect",
					x0: start,
					x1: end,
					y0: 0,
					y1: 1,
					xref: "x",
					yref: "paper",
					fillcolor: "rgba(255, 0, 0, 0.3)",
					line: { width: 0 },
				},
			];
		});
	}, [timelines, posts]);

	const momentsOfChange = useMemo(() => {
		return Object.values(timelines).flatMap((timeline) =>
			timeline.posts
				.map((id) => posts[id])
				.filter(
					(post) =>
						post &&
						(post.label[0]?.includes("S") || post.label[0]?.includes("E"))
				)
				.map((post) => ({
					type: "line",
					x0: new Date(post.created_utc * 1000),
					x1: new Date(post.created_utc * 1000),
					y0: 0,
					y1: 1,
					xref: "x",
					yref: "paper",
					line: {
						color: "rgba(255, 0, 0, 0.7)",
						width: 1,
						dash: "solid",
					},
				}))
		);
	}, [timelines, posts]);

	const overlayTraces = useMemo(() => {
		return Object.values(timelines)
			.map((timeline) => {
				const first = posts[timeline.posts[0]];
				const last = posts[timeline.posts.at(-1)];
				if (!first || !last || !timeline.timeline_of_interest) return null;

				const center = new Date((first.created_utc + last.created_utc) * 500); // average in ms

				return {
					type: "scatter",
					mode: "markers+text",
					x: [new Date(center).toISOString()],
					y: [1],
					yref: "paper",
					marker: {
						size: 14,
						opacity: 0,
						color: "red",
					},
					text: ["🔍"],
					textposition: "middle center",
					textfont: { size: 10 },
					showlegend: false,
					hoverinfo: "skip",
				};
			})
			.filter(Boolean);
	}, [timelines, posts]);

	useEffect(() => {
		if (!zoomRange) return setBinSize("M1");

		const [start, end] = zoomRange.map((date) => new Date(date));
		const days = (end - start) / (1000 * 60 * 60 * 24);

		setBinSize(days > 120 ? "M1" : days > 14 ? 604800000 : 86400000);
	}, [zoomRange]);

	useEffect(() => {
		if (initialZoomRange) {
			setZoomRange(initialZoomRange);
		}
	}, [initialZoomRange]);

	const handleRelayout = useCallback(
		(eventData) => {
			const x0 = eventData["xaxis.range[0]"];
			const x1 = eventData["xaxis.range[1]"];

			if (eventData["xaxis.autorange"]) {
				setZoomRange(null);
				onDateRangeChange(null, null);
			} else if (x0 && x1) {
				const range = [x0, x1];
				setZoomRange(range);
				onDateRangeChange(new Date(x0), new Date(x1));
			}
		},
		[onDateRangeChange]
	);

	const handleClick = useCallback(
		(event) => {
			const point = event.points?.[0];
			if (!point) return;

			const clickDate = new Date(point.x);

			for (const shape of shapes) {
				const start = new Date(shape.x0);
				const end = new Date(shape.x1);
				if (clickDate >= start && clickDate <= end) {
					setZoomRange([start, end]);
					onDateRangeChange(start, end);
					break;
				}
			}
		},
		[shapes, onDateRangeChange]
	);

	return (
		<div style={{ flex: 1, minHeight: 0 }}>
			<Plot
				onClick={handleClick}
				onRelayout={handleRelayout}
				data={[
					{
						x: timestamps,
						type: "histogram",
						xbins: { size: binSize },
						marker: { color: "#3b82f6" },
					},
					...overlayTraces,
					...legendTraces,
				]}
				layout={{
					title: {
						text: "Post Frequency Over Time",
						font: {
							size: 14,
						},
						x: 0.5,
						xanchor: "center",
						showlegend: true,

						margin: { t: 40, r: 20, b: 40, l: 60 }, // leaves space for y-axis
						legend: {
							orientation: "h",
						},
					},
					xaxis: { type: "date", range: zoomRange || undefined },
					yaxis: {
						title: {
							text: "Number of Posts",
							font: {
								size: 14,
								color: "#4a4a4a",
							},
							standoff: 10,
						},
						automargin: true,
					},
					shapes: [...shapes, ...momentsOfChange],
					bargap: 0.05,
					hovermode: "closest",
				}}
				config={{ responsive: true }}
				style={{ width: "100%", height: "100%" }}
				useResizeHandler={true}
			/>
		</div>
	);
};

PlotlyChart.propTypes = {
	userId: PropTypes.string.isRequired,
	posts: PropTypes.object.isRequired,
	timelines: PropTypes.object.isRequired,
	onDateRangeChange: PropTypes.func.isRequired,
};

export default PlotlyChart;
