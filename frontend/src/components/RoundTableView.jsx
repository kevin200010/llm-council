import React from 'react';
import ReactMarkdown from 'react-markdown';
import './RoundTableView.css';

export default function RoundTableView({ iterations, synthesis }) {
  return (
    <div className="council-view round-table-view">
      <div className="council-header">
        <h3>🔄 Round Table Council</h3>
        <p>Collaborative iteration with {iterations?.length || 0} rounds</p>
      </div>

      {iterations && iterations.map((round, idx) => (
        <div key={idx} className="round-section">
          <div className="round-title">Round {round.round}</div>
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
      ))}

      {synthesis && (
        <div className="synthesis-section">
          <div className="synthesis-title">Synthesis</div>
          <div className="synthesis-content">
            <ReactMarkdown>{synthesis.response}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
