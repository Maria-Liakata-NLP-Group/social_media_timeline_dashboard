/** @format */

import PropTypes from "prop-types";

const Summary = ({ summary, handleOnGenerate, isGenerating }) => {
	// 1) Summary already exists
	if (summary) {
		return (
			<>
				<h2 className="subtitle is-4">Summary</h2>
				<p>{summary}</p>
			</>
		);
	}

	// 2) Generation in progress
	if (isGenerating) {
		return (
			<>
				<p className="mb-2">Summary is generating… please wait.</p>
				<button
					className="button is-primary is-small is-loading"
					disabled
				>
					Generating
				</button>
			</>
		);
	}

	// 3) No summary yet, not generating
	return (
		<>
			<p>No summary available yet.</p>
			<button
				className="button is-primary is-small mt-2"
				onClick={handleOnGenerate}
			>
				Generate Summary
			</button>
		</>
	);
};

Summary.propTypes = {
	summary: PropTypes.string.isRequired,
	handleOnGenerate: PropTypes.func.isRequired,
	isGenerating: PropTypes.bool.isRequired,
};

export default Summary;
