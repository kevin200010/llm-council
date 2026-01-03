import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { api } from './api';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState('default');
  // Cache full conversation objects by id so background streams continue
  const [conversationCache, setConversationCache] = useState({});
  const [runningConversationId, setRunningConversationId] = useState(null);
  // preserve scroll position per conversation when switching
  const [scrollPositions, setScrollPositions] = useState({});

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Save scroll position for a conversation
  const handleSaveScroll = (convId, scrollTop) => {
    setScrollPositions((prev) => ({ ...prev, [convId]: scrollTop }));
  };

  const loadConversation = async (id) => {
    try {
      // Prefer the in-memory cache if we have partial/ongoing data
      if (conversationCache[id]) {
        setCurrentConversation(conversationCache[id]);
        return;
      }

      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...conversations,
      ]);
      // Initialize empty cache entry so background updates can attach
      setConversationCache((prev) => ({ ...prev, [newConv.id]: { id: newConv.id, messages: [] } }));
      setCurrentConversationId(newConv.id);
      return newConv;
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    // Save current full conversation into cache before switching away
    if (currentConversationId && currentConversation) {
      setConversationCache((prev) => ({ ...prev, [currentConversationId]: currentConversation }));
    }

    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (id) => {
    try {
      console.log('Deleting conversation:', id);
      const result = await api.deleteConversation(id);
      console.log('Delete result:', result);
      
      // If deleted conversation was selected, clear selection first
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setCurrentConversation(null);
      }
      
      // Reload conversations list to reflect the deletion
      await loadConversations();
      console.log('Conversations reloaded after deletion');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert(`Failed to delete conversation: ${error.message}`);
    }
  };

  const handleSendMessage = async (content, councilType = undefined, convId = null) => {
    const targetConvId = convId || currentConversationId;
    if (!targetConvId) return;

    const effectiveCouncil = councilType || selectedCouncil;
    // Global lock: only one question at a time across all conversations
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Optimistically add user message and a partial assistant message into cache
      const userMessage = { role: 'user', content };
      const assistantMessage = {
        role: 'assistant',
        council_type: effectiveCouncil,
        stage1: null,
        stage2: null,
        stage3: null,
        iterations: null,
        synthesis: null,
        junior_responses: null,
        lead_decision: null,
        stages: null,
        final_output: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
          council: false,
        },
      };

      // Mark running conversation (single active request)
      setRunningConversationId(targetConvId);

      // Upsert into cache for the target conversation
      setConversationCache((prev) => {
        const base = prev[targetConvId] || { id: targetConvId, messages: [] };
        const updated = { ...base, messages: [...(base.messages || []), userMessage, assistantMessage] };
        return { ...prev, [targetConvId]: updated };
      });

      // If the target is the currently selected conversation, update UI immediately
      if (targetConvId === currentConversationId) {
        setCurrentConversation((prev) => ({ ...(prev || {}), messages: [...(prev?.messages || []), userMessage, assistantMessage] }));
      }

      // Helper to apply updates to cache and currentConversation when active
      const applyToCache = (updater) => {
        setConversationCache((prev) => {
          const base = prev[targetConvId] || { id: targetConvId, messages: [] };
          const updated = updater(base);
          return { ...prev, [targetConvId]: updated };
        });

        if (targetConvId === currentConversationId) {
          setCurrentConversation((prev) => updater(prev || { id: targetConvId, messages: [] }));
        }
      };

      await api.sendMessageStream(targetConvId, content, (eventType, event) => {
        switch (eventType) {
          case 'council_start':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading = { ...(lastMsg.loading || {}), council: true };
              return { ...conv, messages };
            });
            break;

          case 'council_complete':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                if (event.iterations) {
                  lastMsg.iterations = event.iterations;
                  lastMsg.synthesis = event.synthesis;
                } else if (event.junior_responses) {
                  lastMsg.junior_responses = event.junior_responses;
                  lastMsg.lead_decision = event.lead_decision;
                } else if (event.stages) {
                  lastMsg.stages = event.stages;
                  lastMsg.final_output = event.final_output;
                } else {
                  lastMsg.stage1 = event.data;
                }
                lastMsg.metadata = event.metadata;
                lastMsg.loading = { ...(lastMsg.loading || {}), council: false };
              }
              return { ...conv, messages };
            });
            break;

          case 'stage1_start':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading = { ...(lastMsg.loading || {}), stage1: true };
              return { ...conv, messages };
            });
            break;

          case 'stage1_complete':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage1 = event.data;
                lastMsg.loading = { ...(lastMsg.loading || {}), stage1: false };
              }
              return { ...conv, messages };
            });
            break;

          case 'stage2_start':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading = { ...(lastMsg.loading || {}), stage2: true };
              return { ...conv, messages };
            });
            break;

          case 'stage2_complete':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage2 = event.data;
                lastMsg.metadata = event.metadata;
                lastMsg.loading = { ...(lastMsg.loading || {}), stage2: false };
              }
              return { ...conv, messages };
            });
            break;

          case 'stage3_start':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading = { ...(lastMsg.loading || {}), stage3: true };
              return { ...conv, messages };
            });
            break;

          case 'stage3_complete':
            applyToCache((conv) => {
              const messages = [...(conv.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage3 = event.data;
                lastMsg.loading = { ...(lastMsg.loading || {}), stage3: false };
              }
              return { ...conv, messages };
            });
            break;

          case 'title_complete':
            // update title in backend and refresh list
            loadConversations();
            break;

          case 'complete':
            // Completed: backend persisted assistant message; refresh lists and clear busy state
            loadConversations();
            setIsLoading(false);
            setRunningConversationId(null);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setIsLoading(false);
            setRunningConversationId(null);
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      }, effectiveCouncil);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error from cache
      setConversationCache((prev) => {
        const base = prev[targetConvId] || { id: targetConvId, messages: [] };
        return { ...prev, [targetConvId]: { ...base, messages: (base.messages || []).slice(0, -2) } };
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        runningConversationId={runningConversationId}
      />
      <div className="main-content">
        <ChatInterface
          conversation={currentConversation}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedCouncil={selectedCouncil}
          onNewConversation={handleNewConversation}
          savedScroll={scrollPositions[currentConversationId]}
          onSaveScroll={handleSaveScroll}
        />
      </div>
    </div>
  );
}

export default App;
