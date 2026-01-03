import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './RoundTableView.css';

export default function RoundTableView({ iterations, synthesis }) {
  const [expandedRounds, setExpandedRounds] = useState(
    iterations ? Object.fromEntries(iterations.map((_, idx) => [idx, false])) : {}
  );
  const [isSynthesisExpanded, setIsSynthesisExpanded] = useState(false);

  const toggleRound = (idx) => {
    setExpandedRounds(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="council-view round-table-view">
      <div className="council-header">
        <h3>🔄 Round Table Council</h3>
        <p>Collaborative iteration with {iterations?.length || 0} rounds</p>
      </div>

      {iterations && iterations.map((round, idx) => (
        <div key={idx} className="round-section">
          <button className="stage-header-btn" onClick={() => toggleRound(idx)}>
            <div className="round-title">
              <span className="expand-icon">{expandedRounds[idx] ? '▼' : '▶'}</span>
              Round {round.round}
            </div>
          </button>

          {expandedRounds[idx] && (
            <div className="stage-content">
              <div className="responses-grid">
                {round.responses && round.responses.map((response, respIdx) => (
                  <div key={respIdx} className="response-card">
                    <div className="response-model">{response.model}</div>
                    <div className="response-text">
                      <ReactMarkdown>{response.response}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {synthesis && (
        <div className="synthesis-section">
          <button className="stage-header-btn" onClick={() => setIsSynthesisExpanded(!isSynthesisExpanded)}>
            <div className="synthesis-title">
              <span className="expand-icon">{isSynthesisExpanded ? '▼' : '▶'}</span>
              Synthesis
            </div>
          </button>

          {isSynthesisExpanded && (
            <div className="stage-content">
              <div className="synthesis-content">
                <ReactMarkdown>{synthesis.response}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
