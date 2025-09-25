/** @format */

import PropTypes from "prop-types";

const Panel = ({ children, flexGrow = 0, height = "auto", position = "" }) => {
	return (
		<div
			className={`is-flex is-flex-direction-column 
            box is-shadowless m-2 is-flex-grow-${flexGrow} 
            is-justify-content-space-between
            `}
			style={{ height: height, position: position }}
		>
			{children}
		</div>
	);
};

Panel.propTypes = {
	children: PropTypes.node.isRequired,
	flexGrow: PropTypes.number,
	height: PropTypes.string,
	position: PropTypes.string,
};

export default Panel;
