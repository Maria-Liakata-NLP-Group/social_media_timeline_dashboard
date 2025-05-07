import React, { useState, useEffect, useRef } from "react";
import { Legend, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine } from "recharts";
import dayjs from "dayjs";
import CustomLegend from "./customLegend";

const highlightRanges = [
    { start: "2019-10-01", end: "2019-12-01", color: "rgba(255, 100, 100, 0.7)" }, 
    { start: "2018-08-01", end: "2018-11-01", color: "rgba(255, 100, 100, 0.7)" },
    { start: "2018-02-01", end: "2018-03-01", color: "rgba(255, 100, 100, 0.7)" },
    { start: "2019-10-12", end: "2019-11-04", color: "rgba(255, 100, 100, 0.7)" }  
];

const momentOfChange = ["2019-10-12", "2019-10-13", "2019-10-18", "2019-10-21", "2019-10-28", "2019-10-29"]

const SocialMediaLineGraph = ({ data }) => {

    const [range, setRange] = useState([0, data.length - 1]);
    const [isHovering, setIsHovering] = useState(false);
    const chartRef = useRef(null);

        const handleWheelZoom = (event) => {
        // if (!isHovering) return; // Only zoom if hovering over the chart
        event.preventDefault();
        if (!chartRef.current) return;

        const zoomFactor = 0.1; // Adjusts how much to zoom per scroll
        const zoomStep = event.deltaY > 0 ? 1 : -1; // Scroll down = zoom in, Scroll up = zoom out
        const [start, end] = range;
        const dataLength = data.length;

        // Get mouse position relative to the chart
        const chartRect = chartRef.current.getBoundingClientRect();
        const mouseX = event.clientX - chartRect.left;
        const chartWidth = chartRect.width;

        // Calculate mouse position as a percentage of chart width
        const mouseRatio = mouseX / chartWidth;

        if (zoomStep > 0 && end - start > 2) {
            // Zoom In: Shrink range towards mouse focus
            const newStart = Math.round(start + (end - start) * mouseRatio * zoomFactor);
            const newEnd = Math.round(end - (end - start) * (1 - mouseRatio) * zoomFactor);
            setRange([newStart, newEnd]);
        } else if (zoomStep < 0) {

            setRange([0, dataLength - 1]);
        }
            // Zoom Out: Expand range outward from mouse focus
        //     const expansion = (end - start) * zoomFactor;
        //     const newStart = Math.max(0, Math.round(start - expansion * mouseRatio));
        //     const newEnd = Math.min(dataLength - 1, Math.round(end + expansion * (1 - mouseRatio)));

        //     // Ensure the range expands but does not exceed the dataset bounds
        //     if (newStart <= 0 && newEnd >= dataLength - 1) {
        //         setRange([0, dataLength - 1]); // Fully zoomed out
        //     } else {
        //         setRange([newStart, newEnd]);
        //     }
        // }
    };

    // Attach wheel event listener
    useEffect(() => {
        if (isHovering) {
            window.addEventListener("wheel", handleWheelZoom, { passive: false });
        }
        else {
            window.removeEventListener("wheel", handleWheelZoom);
        }
        
        return () => {
            window.removeEventListener("wheel", handleWheelZoom)
        };
    }, [isHovering]);

    // Extract only the visible data range
    const zoomedData = data.slice(range[0], range[1] + 1);

        // Format the date for better readability
    const formattedData = zoomedData.map(item => ({
        ...item,
        date: dayjs(item.date).format("DD MMM YYYY"), // Converts "2019-10-25" -> "25 Oct 2019"
    }));

    return (
        <>
            
            <div 
                className="p-4 bg-white rounded-lg shadow-md" 
                ref={chartRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
             <h2 className="subtitle is-4">Social Media Activity</h2>   
                <ResponsiveContainer width="100%" height={300}>
                    
                    <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />



                        <XAxis dataKey="date" angle={0} textAnchor="end" />
                        <YAxis />
                        <Tooltip />
                        
                        <Legend content={<CustomLegend/>} />
                        <Line type="monotone" dataKey="posts" stroke="#8884d8" strokeWidth={2} />
                                                {/* 🔥 Highlighted Areas */}
                        {highlightRanges.map((range, index) => (
                            <ReferenceArea
                                key={index}
                                x1={dayjs(range.start).format("DD MMM YYYY")}
                                x2={dayjs(range.end).format("DD MMM YYYY")}
                                fill={range.color}
                                strokeOpacity={0} //
                            />
                        ))}
                        {momentOfChange.map((date, index) => (
                            <ReferenceLine 
                                key={index}
                                x={dayjs(date).format("DD MMM YYYY")} 
                                stroke="red" 
                                strokeDasharray="8 8" // Makes it dotted 
                                label="E" // Adds a label to the line  
                                strokeWidth={2}
                            />
                        ))}
                        <ReferenceLine 
                            x={dayjs("2019-10-15").format("DD MMM YYYY")} 
                            stroke="red" 
                            strokeDasharray="8 8" // Makes it dotted 
                            label="E" // Adds a label to the line  
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default SocialMediaLineGraph;
