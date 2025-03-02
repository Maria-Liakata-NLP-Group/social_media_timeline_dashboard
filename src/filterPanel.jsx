import Panel from "./components/panel";
import PropTypes from 'prop-types';
import { useState} from "react";


const FilterPanel = ({setFilter, timelineIds, summaryTypes}) => {
    const [timelineId, setTimelineId] = useState(timelineIds[0])
    const [summary, setSummary] = useState(summaryTypes[0])

    return (
        <Panel>

            <h1 className="subtitle is-5">Timeline</h1>
            <div className="select">
                <select onChange={(e) => setTimelineId(e.target.value)}>
                    {
                        timelineIds.map((id, index) => {
                            return <option key={index} value={id}>{id}</option>
                        })
                    }
                </select>
            </div>

            <h1 className="subtitle is-5">Summary</h1>
            <div className="select">
                <select onChange={(e) => setSummary(e.target.value)}>
                    {
                        summaryTypes.map((type, index) => {
                            return <option key={index} value={type}>{type}</option>
                        })
                    }
                </select>
            </div>
            <button className="button is-primary" 
                onClick={() => setFilter(timelineId, summary)}>
                    Generate
            </button>
        </Panel>
    );
}

FilterPanel.propTypes = {
    setFilter: PropTypes.func.isRequired,
    timelineIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    summaryTypes: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default FilterPanel;
