/** @format */

import "./style.scss";
import ContentPanel from "./contentPanel";

function App() {
	return (
		<div className="is-flex p-2 root-container">
			<ContentPanel userIds={["tomorrowistomato"]} />
		</div>
	);
}

export default App;
