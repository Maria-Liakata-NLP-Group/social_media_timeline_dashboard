/** @format */

import "./style.scss";
import ContentPanel from "./contentPanel";

function App() {
	return (
		<div className="is-flex root-container">
			<ContentPanel userIds={["tomorrowistomato"]} />
		</div>
	);
}

export default App;
