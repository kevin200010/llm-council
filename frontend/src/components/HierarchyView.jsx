import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './HierarchyView.css';

export default function HierarchyView({ juniorResponses, leadDecision }) {
  const [isJuniorExpanded, setIsJuniorExpanded] = useState(false);
  const [isLeadExpanded, setIsLeadExpanded] = useState(false);

  return (
    <div className="council-view hierarchy-view">
      <div className="council-header">
        <h3>👑 Hierarchy Council</h3>
        <p>Lead Agent decision based on {juniorResponses?.length || 0} junior agents</p>
      </div>

      <div className="junior-section">
        <button className="stage-header-btn" onClick={() => setIsJuniorExpanded(!isJuniorExpanded)}>
          <div className="section-title">
            <span className="expand-icon">{isJuniorExpanded ? '▼' : '▶'}</span>
            Junior Agent Responses
          </div>
        </button>

        {isJuniorExpanded && (
          <div className="stage-content">
            <div className="responses-grid">
              {juniorResponses && juniorResponses.map((response, idx) => (
                <div key={idx} className="response-card">
                  <div className="response-model">📋 {response.model}</div>
                  <div className="response-text">
                    <ReactMarkdown>{response.response}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {leadDecision && (
        <div className="lead-decision-section">
          <button className="stage-header-btn" onClick={() => setIsLeadExpanded(!isLeadExpanded)}>
            <div className="lead-header">
              <div className="lead-title">
                <span className="expand-icon">{isLeadExpanded ? '▼' : '▶'}</span>
                👑 Lead Agent Decision
              </div>
              <div className="lead-role">{leadDecision.role}</div>
            </div>
          </button>

          {isLeadExpanded && (
            <div className="stage-content">
              <div className="lead-content">
                <ReactMarkdown>{leadDecision.decision}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
