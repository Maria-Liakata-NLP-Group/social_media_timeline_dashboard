import PropTypes from "prop-types";
import {useState} from "react";

const Summary = ({summary, userId, postIds, onGenerationComplete}) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerateSummary = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/generate-summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    posts_ids: postIds,
                    prompt_type: "specific"
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Summary generated for user:", data.userid);
                if (onGenerationComplete) onGenerationComplete(); // optional callback
            } else {
                setError(data.error || "Failed to generate summary.");
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
        }

        setLoading(false);
    };

    const summaryDOM = summary ? (
        <>
            <h2 className="subtitle is-4">Summary</h2>
            <p>{summary}</p>
        </> ) : (
            <>
            <p>No summary available yet.</p>
            <button className="button is-primary is-small mt-2" onClick={handleGenerateSummary}>Generate Summary</button>
            </>
        )

    return (
        <>
            {summaryDOM}
        </>
    );
}

Summary.propTypes = {
    summary: PropTypes.string.isRequired,
};

export default Summary;