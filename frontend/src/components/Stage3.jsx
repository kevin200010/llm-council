import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!finalResponse) {
    return null;
  }

  return (
    <div className="stage stage3">
      <button className="stage-header-btn" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="stage-title">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          Stage 3: Final Council Answer
        </h3>
      </button>

      {isExpanded && (
        <div className="stage-content">
          <div className="final-response">
            <div className="chairman-label">
              Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
            </div>
            <div className="final-text markdown-content">
              <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
