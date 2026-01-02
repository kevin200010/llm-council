import React from 'react';
import './CouncilSelector.css';

const COUNCIL_TYPES = [
  {
    id: 'default',
    name: 'The 3-Stage Council',
    description: 'Collect → Rank → Synthesize',
    icon: '🏛️'
  },
  {
    id: 'round_table',
    name: 'The Round Table',
    description: 'Every agent sees every other agent\'s response and iterates together',
    icon: '⚔️'
  },
  {
    id: 'hierarchy',
    name: 'The Hierarchy',
    description: 'Junior agents report to a "Lead Agent" who makes the final call',
    icon: '👑'
  },
  {
    id: 'assembly_line',
    name: 'The Assembly Line',
    description: 'Agent A finishes, then Agent B starts, then Agent C polishes',
    icon: '⚙️'
  }
];

function CouncilSelector({ selectedCouncil, onSelectCouncil }) {
  return (
    <div className="council-selector">
      <div className="council-selector-header">
        <h2>Select Council Type</h2>
        <p>Choose how the council will collaborate</p>
      </div>
      
      <div className="council-grid">
        {COUNCIL_TYPES.map((council) => (
          <div
            key={council.id}
            className={`council-card ${selectedCouncil === council.id ? 'selected' : ''}`}
            onClick={() => onSelectCouncil(council.id)}
          >
            <div className="council-icon">{council.icon}</div>
            <h3>{council.name}</h3>
            <p className="council-process">{council.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CouncilSelector;
