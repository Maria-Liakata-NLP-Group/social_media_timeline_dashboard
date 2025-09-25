/** @format */
import PropTypes from "prop-types";

function FileUpload({ handleFileUpload }) {
	return (
		<div className="file">
			<label className="file-label">
				<input
					className="file-input"
					type="file"
					name="resume"
					onChange={handleFileUpload}
				/>
				<span className="file-cta">
					<span className="file-icon">
						<i className="fa-solid fa-upload"></i>
					</span>
					<span className="file-label"> Choose a file… </span>
				</span>
			</label>
		</div>
	);
}

FileUpload.propTypes = {
	handleFileUpload: PropTypes.func.isRequired,
};

export default FileUpload;
