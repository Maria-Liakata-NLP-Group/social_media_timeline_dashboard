// this module presents posts as barplots were x axis is divided into 
// 4 periods and the y axis represents the number of posts in each period
// the barplot is divided into escalation, switch or 0

import Panel from "./panel";
import {useEffect} from "react";

const calculateBar = (index, height, maxHeight, labels, returnFunction, activeBar) => {
    const totalHeight = (height / maxHeight) * 100;
    if (totalHeight === 0) return "";
    const escalationBarHeight = labels?.E ? (labels.E / maxHeight) * 100 : 0;
    const switchBarHeight = labels?.S ? (labels.S / maxHeight) * 100 : 0;

    return (
        <>
            <div 
                className="has-background-escalation"
                style={{height: `${escalationBarHeight}%`,
                        position: "absolute",
                        bottom: 0,
                        left: `${index * 25}%`, 
                        width: "25%",
            }}></div>
            <div 
                className="has-background-switch"
                style={{height: `${switchBarHeight}%`,
                        position: "absolute",
                        bottom: `${escalationBarHeight}%`,
                        left: `${index * 25}%`, 
                        width: "25%",
            }}></div>
            <div 
                onClick={() => returnFunction(index)}
                className={`has-border is-bar ${index === activeBar ? "is-active" : ""} is-clickable`}
                style={{height: `${totalHeight}%`,
                        position: "absolute",
                        bottom: "0",
                        left: `${index * 25}%`,
                        width: "25%",   
            }}></div>

        </>
    )
}

const PeriodPlot = ({timeline, returnFunction, activeBar}) => {

    useEffect(() => {
        console.log(timeline)
    }
    , [timeline])

    return (
            <div className="is-flex-grow-1 is-flex is-flex-direction-column mr-6 ml-6">
                <div>
                    <span className="has-background-escalation p-2 ml-4">Escalation</span>
                    <span className="has-background-switch p-2 ml-4">Switch</span>
                </div>
                <div className="is-flex-grow-1 is-flex">
                    <div className="is-flex is-coordinate-system pr-3 pl-3" style={{width: "100%"}}>
                        <div 
                            className="is-flex-grow-1"
                            style={{position: "relative"}}>
                        {
                            timeline["periods"].map((period, index) => {

                                return (
                                    calculateBar(
                                        index,
                                        timeline["period_post_indices"][index].length, 
                                        timeline["number_of_posts"], 
                                        timeline["period_label_counts"][index],
                                        returnFunction,
                                        activeBar
                                        )
                                    )
                                }
                            )
                        }
                        </div>
                    </div>
                </div>
                <div style={{position: "relative"}}>
                        {
                            timeline["periods"].map((period, index) => {
                                    const [datePart, timePart] = period.split(", ");
                                    const [day, month, year] = datePart.split("-");
                                    const date = new Date(`${year}-${month}-${day}T${timePart}`);
                                    const formattedDate = date.toLocaleDateString("en-GB", 
                                                            { 
                                                                day: "2-digit", 
                                                                month: "short", 
                                                                year: "numeric" 
                                                            });
                                    return (
                                        <div key={index} style={{
                                            width: "20%",
                                            textAlign: "center",
                                            position: "absolute",
                                            left: `${index * 25 - 10}%`,
                                        }}>
                                            {
                                                formattedDate
                                            }
                                        </div>
                                    )
                                }
                            )
                        }

                </div>
            </div>
    );
}

export default PeriodPlot;