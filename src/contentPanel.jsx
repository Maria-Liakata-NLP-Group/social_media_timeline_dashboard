import Panel from "./components/panel";
import PropTypes from 'prop-types';
import { useState, useEffect } from "react";

const ContentPanel = ({tlid, summary}) => { 
    
    const [timeline, setTimeline] = useState(null)

    // dynamically load json file 
    useEffect(() => {
        fetch(`/data/${tlid}.json`)
            .then(response => response.json())
            .then(data => setTimeline(data))
    }, [tlid, setTimeline])

    return (
        <Panel flexGrow={1}>
            <div className="box is-shadowless has-border">
                <h2 className="subtitle is-4">Summary</h2>
                {summary}
            </div>
            <div className="table-container">
                <table className="table is-fullwidth is-hoverable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Post</th>
                            <th>Moment of Change</th>
                            <th>Inferred Symptoms</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            timeline && timeline.map((event, index) => {
                                // Convert to a Date object
                                const date = new Date(event.date);
                                const formattedDate = date.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                });
                                const formattedTime = date.toLocaleTimeString("en-GB", { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    second: '2-digit' 
                                });   
                                return (
                                    <tr key={index}>
                                        <td>{formattedDate}</td>
                                        <td>{formattedTime}</td>
                                        <td>{event.content}</td>
                                        <td>{event.label[0]}</td>
                                        <td>{""}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

ContentPanel.propTypes = {
    tlid: PropTypes.number.isRequired,
    summary: PropTypes.string.isRequired
}

export default ContentPanel;

