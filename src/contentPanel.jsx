import Panel from "./components/panel";
import PeriodPlot from "./components/periodPlot";
import PropTypes from 'prop-types';
import { useState, useEffect } from "react";

const ContentPanel = ({summaries, summaryTypes}) => { 

    const timelineIds = Object.keys(summaries)
    
    const [timeline, setTimeline] = useState(null)
    const [timelineId, setTimelineId] = useState(timelineIds[0])
    const [summaryType, setSummaryTypes] = useState(summaryTypes[0])
    const [period, setPeriod] = useState("all") // Period can be "all" or 0,1,2,3

    const selectPeriod = (index) => {
        if (index === period) {
            setPeriod("all")
        }
        else {
            setPeriod(index)
        }
    }

    // dynamically load json file 
    useEffect(() => {
        fetch(`/data/${timelineId}.json`)
            .then(response => response.json())
            .then(data => setTimeline(data))
    }, [timelineId, setTimeline])

    return (
        <Panel flexGrow={1} height={"95vh"}>
            <div style={{height: "5%"}}>
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
            </div>
            <div className="is-flex" style={{height: "40%"}}>
                <div className="box is-shadowless has-border is-flex-grow-2"
                     style={{ flexBasis: "70%",
                              overflowX: "scroll"
                      }}
                >
                    <h2 className="subtitle is-4">Summary {`(Time period: ${period === "all" ? period : period + 1})`} </h2>
                    {summaries[timelineId][summaryType][period]}
                </div>
                <div className="is-flex is-flex-direction-column box is-shadowless is-flex-grow-1"
                     style={{ flexBasis: "30%" }}>
                    <PeriodPlot 
                        timeline={summaries[timelineId][summaryType]} 
                        returnFunction={selectPeriod} 
                        activeBar={period}
                    />
                </div>
            </div>
            <div className="table-container"
                style={{height: "40%"}}
            >
                <table className="table is-fullwidth is-hoverable"
                >
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Post</th>
                            <th>Moment of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            timeline && timeline.map((event, index) => {
                                if (period !== "all") {
                                    const postIndices = summaries[timelineId][summaryType]["period_post_indices"][period]
                                    const postIndex = event.postid
                                    console.log(`postIndex: ${postIndex}`)
                                    if (!postIndices.includes(postIndex)) {
                                        return null
                                    }
                                }
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
                                
                                const label = event.label[0]
                                let rowBackground = ""
                                if (label === "S") {
                                    rowBackground = "has-background-switch"
                                }
                                else if (label === "E") {
                                    rowBackground = "has-background-escalation"
                                }   
                                return (
                                    <tr key={index} className={rowBackground}>
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

