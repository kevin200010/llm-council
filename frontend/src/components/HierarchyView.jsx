import React from 'react';
import ReactMarkdown from 'react-markdown';
import './HierarchyView.css';

export default function HierarchyView({ juniorResponses, leadDecision }) {
  return (
    <div className="council-view hierarchy-view">
      <div className="council-header">
        <h3>👑 Hierarchy Council</h3>
        <p>Lead Agent decision based on {juniorResponses?.length || 0} junior agents</p>
      </div>

      <div className="junior-section">
        <div className="section-title">Junior Agent Responses</div>
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

      {leadDecision && (
        <div className="lead-decision-section">
          <div className="lead-header">
            <div className="lead-title">👑 Lead Agent Decision</div>
            <div className="lead-role">{leadDecision.role}</div>
          </div>
          <div className="lead-content">
            <ReactMarkdown>{leadDecision.decision}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
