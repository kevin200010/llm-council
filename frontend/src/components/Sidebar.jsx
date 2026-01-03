import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  runningConversationId,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDeleteClick = (e, convId) => {
    e.stopPropagation();
    setDeleteConfirm(convId);
  };

  const confirmDelete = async (convId) => {
    setIsDeleting(convId);
    try {
      await onDeleteConversation(convId);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LLM Council</h1>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
            >
              <div
                className="conversation-content"
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="conversation-title">
                  {conv.title || 'New Conversation'}
                </div>
                <div className="conversation-meta">
                  {conv.message_count} messages
                </div>
              </div>

              {/* Show a single running indicator for the active running conversation */}
              {runningConversationId === conv.id && (
                <div className="running-indicator" title="Running">
                  ●
                </div>
              )}

              {deleteConfirm === conv.id ? (
                <div className="delete-confirm">
                  <button
                    className="confirm-btn"
                    onClick={() => confirmDelete(conv.id)}
                    disabled={isDeleting === conv.id}
                  >
                    {isDeleting === conv.id ? '...' : 'Yes'}
                  </button>
                  <button 
                    className="cancel-btn" 
                    onClick={cancelDelete}
                    disabled={isDeleting === conv.id}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, conv.id)}
                  title="Delete conversation"
                  disabled={isDeleting === conv.id}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
