import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import RoundTableView from './RoundTableView';
import HierarchyView from './HierarchyView';
import AssemblyLineView from './AssemblyLineView';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
  selectedCouncil,
}) {
  const [input, setInput] = useState('');
  const [messageCouncil, setMessageCouncil] = useState(selectedCouncil || 'default');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Keep per-message selector in sync with global selectedCouncil
  useEffect(() => {
    setMessageCouncil(selectedCouncil || 'default');
  }, [selectedCouncil]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, messageCouncil);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">
                    LLM Council
                    {msg.council_type && msg.council_type !== 'default' && (
                      <span className="council-badge">{msg.council_type}</span>
                    )}
                  </div>

                  {/* Round Table View */}
                  {msg.council_type === 'round_table' && (
                    <>
                      {msg.loading?.council && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Round Table Council in session...</span>
                        </div>
                      )}
                      {msg.iterations && (
                        <RoundTableView
                          iterations={msg.iterations}
                          synthesis={msg.synthesis}
                        />
                      )}
                    </>
                  )}

                  {/* Hierarchy View */}
                  {msg.council_type === 'hierarchy' && (
                    <>
                      {msg.loading?.council && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Hierarchy Council in session...</span>
                        </div>
                      )}
                      {msg.junior_responses && (
                        <HierarchyView
                          juniorResponses={msg.junior_responses}
                          leadDecision={msg.lead_decision}
                        />
                      )}
                    </>
                  )}

                  {/* Assembly Line View */}
                  {msg.council_type === 'assembly_line' && (
                    <>
                      {msg.loading?.council && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Assembly Line Council in session...</span>
                        </div>
                      )}
                      {msg.stages && (
                        <AssemblyLineView
                          stages={msg.stages}
                          finalOutput={msg.final_output}
                        />
                      )}
                    </>
                  )}

                  {/* Default 3-Stage View */}
                  {(!msg.council_type || msg.council_type === 'default') && (
                    <>
                      {/* Stage 1 */}
                      {msg.loading?.stage1 && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Running Stage 1: Collecting individual responses...</span>
                        </div>
                      )}
                      {msg.stage1 && <Stage1 responses={msg.stage1} />}

                      {/* Stage 2 */}
                      {msg.loading?.stage2 && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Running Stage 2: Peer rankings...</span>
                        </div>
                      )}
                      {msg.stage2 && (
                        <Stage2
                          rankings={msg.stage2}
                          labelToModel={msg.metadata?.label_to_model}
                          aggregateRankings={msg.metadata?.aggregate_rankings}
                        />
                      )}

                      {/* Stage 3 */}
                      {msg.loading?.stage3 && (
                        <div className="stage-loading">
                          <div className="spinner"></div>
                          <span>Running Stage 3: Final synthesis...</span>
                        </div>
                      )}
                      {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Always show input form at the bottom so users can continue asking questions */}
      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          className="message-input"
          placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
        />

        <div className="message-controls">
          <select
            value={messageCouncil}
            onChange={(e) => setMessageCouncil(e.target.value)}
            disabled={isLoading}
            aria-label="Select council type"
          >
            <option value="default">3-Stage</option>
            <option value="round_table">Round Table</option>
            <option value="hierarchy">Hierarchy</option>
            <option value="assembly_line">Assembly Line</option>
          </select>

          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
