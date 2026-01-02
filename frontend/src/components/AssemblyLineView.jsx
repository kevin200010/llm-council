import React from 'react';
import ReactMarkdown from 'react-markdown';
import './AssemblyLineView.css';

export default function AssemblyLineView({ stages, finalOutput }) {
  const stageLabels = {
    1: { name: 'Drafter', icon: '✍️' },
    2: { name: 'Reviewer & Expander', icon: '🔍' },
    3: { name: 'Polisher', icon: '✨' }
  };

  return (
    <div className="council-view assembly-line-view">
      <div className="council-header">
        <h3>⚙️ Assembly Line Council</h3>
        <p>Sequential workflow through {stages?.length || 3} stages</p>
      </div>

      <div className="stages-timeline">
        {stages && stages.map((stage, idx) => {
          const label = stageLabels[stage.stage] || { name: `Stage ${stage.stage}`, icon: '📋' };
          return (
            <div key={idx} className="stage-node">
              <div className="stage-icon">{label.icon}</div>
              <div className="stage-card">
                <div className="stage-header">
                  <div className="stage-number">Stage {stage.stage}</div>
                  <div className="stage-role">{label.name}</div>
                </div>
                <div className="stage-agent">
                  <strong>Agent:</strong> {stage.agent}
                </div>
                <div className="stage-content">
                  <ReactMarkdown>{stage.response}</ReactMarkdown>
                </div>
              </div>
              {idx < stages.length - 1 && <div className="arrow">→</div>}
            </div>
          );
        })}
      </div>

      {finalOutput && (
        <div className="final-output-section">
          <div className="final-header">
            <div className="final-title">🎯 Final Output</div>
            <div className="final-subtitle">Polished and ready</div>
          </div>
          <div className="final-content">
            <ReactMarkdown>{finalOutput.response}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
