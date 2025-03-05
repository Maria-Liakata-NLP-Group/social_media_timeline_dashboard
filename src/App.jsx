import './style.scss';
import ContentPanel from './contentPanel';
import FilterPanel from './filterPanel';
import { useState, useEffect} from 'react';
import summaries from './assets/timeline_summarization_orders.json'

const summaryTypes = [
              "Llama-3.1-8B-Instruct",  
            ]

function App() {
  const [timelineId, setTimelineId] = useState("0cac13e357")
  const [summary, setSummary] = useState(summaryTypes[0])

  const setInfo = (id, sum) => {
    setTimelineId(id)
    setSummary(sum)
  }

  useEffect(() => {
    console.log(summaries[timelineId])
  }, [timelineId, summary])

  return (
    <div className='is-flex p-2 root-container'>
      {/* <FilterPanel 
        setFilter={setInfo}
        timelineIds={Object.keys(summaries)}
        summaryTypes={summaryTypes}  
      /> */}
      <ContentPanel summaries={summaries} summaryTypes={summaryTypes}/>
    </div>
  )
}

export default App
