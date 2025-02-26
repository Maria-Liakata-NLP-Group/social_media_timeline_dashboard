import './style.scss';
import ContentPanel from './contentPanel';
import FilterPanel from './filterPanel';
import { useState, useEffect} from 'react';
import summaries from './assets/timeline_summarization_orders.json'

function App() {
  const [timelineId, setTimelineId] = useState("52568_104")
  const [summary, setSummary] = useState("Best LLaMA")

  useEffect(() => {
    console.log(summaries[timelineId])
  }, [timelineId, summary])

  return (
    <div className='is-flex p-2 root-container'>
      <FilterPanel getTimelineId={setTimelineId} getSummary={setSummary}/>
      <ContentPanel tlid={timelineId} summary={summaries[timelineId][summary]}/>
    </div>
  )
}

export default App
