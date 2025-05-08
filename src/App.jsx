/** @format */

import "./style.scss";
import ContentPanel from "./contentPanel";
import Panel from "./components/panel";
import userIds from "./assets/user_ids.json";
import { useState } from "react";

function App() {
	const [userId, setUserId] = useState(userIds.ids[0]);
	return (
		<div className="is-flex root-container">
			<Panel
				flexGrow={1}
				height={"95vh"}
			>
				<div
					className="mb-4"
					style={{ flex: "0 0 auto" }}
				>
					<h1 className="subtitle is-5">Client ID</h1>
					<div className="select">
						<select onChange={(e) => setUserId(e.target.value)}>
							{userIds.ids.map((id) => (
								<option
									key={id}
									value={id}
								>
									{id}
								</option>
							))}
						</select>
					</div>
				</div>
				<ContentPanel userId={userId} />
			</Panel>
		</div>
	);
}

export default App;
