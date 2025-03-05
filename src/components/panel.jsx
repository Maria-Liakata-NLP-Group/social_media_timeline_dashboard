import PropTypes from 'prop-types';

const Panel = ({ children , flexGrow = 0, height = "auto"}) => {    
    return (
        <div className={`is-flex is-flex-direction-column 
            box m-2 is-flex-grow-${flexGrow} 
            is-justify-content-space-between`}
            style={{height: height}}>
            {children}
        </div>
    );
}

Panel.propTypes = {
    children: PropTypes.node.isRequired,
    flexGrow: PropTypes.number,
    height: PropTypes.string
}

export default Panel;