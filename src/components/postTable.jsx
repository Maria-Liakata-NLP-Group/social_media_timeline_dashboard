/** @format */

import { useMemo } from "react";
import PropTypes from "prop-types";

const PostTable = ({ posts, filteredKeys }) => {
	const filteredPosts = useMemo(
		() => filteredKeys.map((key) => posts[key]),
		[posts, filteredKeys]
	);

	return (
		<table className="table is-fullwidth is-hoverable">
			<thead>
				<tr>
					<th>Date</th>
					<th>Time</th>
					<th>Post</th>
					<th>Moment of Change</th>
				</tr>
			</thead>
			<tbody>
				{Object.values(filteredPosts).map((post, index) => {
					// Convert to a Date object
					const date = new Date(post.created_utc * 1000);

					const formattedDate = date.toLocaleDateString("en-GB", {
						day: "numeric",
						month: "long",
						year: "numeric",
					});
					const formattedTime = date.toLocaleTimeString("en-GB", {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					});

					const label = String(post.label[0]);
					let rowBackground = "";
					if (label.includes("S")) {
						rowBackground = "has-background-switch";
					} else if (label.includes("E")) {
						rowBackground = "has-background-escalation";
					}

					const content = (
						<>
							<h3 className="subtitle is-5">{post.title}</h3>
							<p>{post.body}</p>
						</>
					);
					return (
						<tr key={index}>
							<td>{formattedDate}</td>
							<td>{formattedTime}</td>
							<td>{content}</td>
							<td className={rowBackground}>{post.label[0]}</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

PostTable.propTypes = {
	posts: PropTypes.object.isRequired,
	filteredKeys: PropTypes.array.isRequired,
};

export default PostTable;
