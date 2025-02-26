import PropTypes from 'prop-types';

const Panel = ({ children , flexGrow = 0}) => {    
    return (
        <div className={`box m-2 is-flex-grow-${flexGrow}`}>
            {children}
        </div>
    );
}

Panel.propTypes = {
    children: PropTypes.node.isRequired,
    flexGrow: PropTypes.number
}

export default Panel;