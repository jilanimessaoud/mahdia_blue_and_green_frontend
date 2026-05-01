import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import chatService from '../services/chat.service';
import { getApiBaseUrl } from '../services/api';
import {
  classifyLocalSearch,
  filterPublishedCatalog,
  formatCatalogResults,
  formatConversationStats,
  getGreetingReply,
} from '../utils/dolphinbotCatalog';
import {
  DOLPHINBOT_SITE_CONTEXT,
  getDolphinbotWelcomeMessage,
  resolveDolphinbotOfflineReply,
} from '../utils/dolphinbotSiteContext';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: getDolphinbotWelcomeMessage() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [websiteData, setWebsiteData] = useState({ articles: [], events: [] });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const widgetRef = useRef(null);
  const location = useLocation();
  const { isDark } = useTheme();

  if (location.pathname.startsWith('/admin') || location.pathname === '/chatbot') return null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const loadPosts = async (type) => {
      const base = getApiBaseUrl();
      try {
        const r = await fetch(`${base}/posts?type=${type}&limit=40`);
        const json = await r.json().catch(() => ({}));
        if (!r.ok) return [];
        const data = json.data;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const fetchData = async () => {
      try {
        const [articles, events] = await Promise.all([loadPosts('article'), loadPosts('event')]);
        setWebsiteData({ articles, events });
      } catch (err) {
        console.log('dolphinbot: Could not fetch website data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 4000);
    const hideTimer = setTimeout(() => setShowHint(false), 10000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  const sendMessage = async (directMessage = null) => {
    const messageToSend = directMessage || input.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    const greetingText = getGreetingReply(messageToSend);
    if (greetingText) {
      setMessages((prev) => [...prev, { role: 'assistant', content: greetingText }]);
      setIsLoading(false);
      return;
    }

    const lowerMessage = messageToSend.toLowerCase();
    const { useLocal, mode, query: searchQuery } = classifyLocalSearch(messageToSend);

    if (useLocal) {
      const results = filterPublishedCatalog(websiteData, searchQuery, mode);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: formatCatalogResults(results, searchQuery, mode) },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      let ctx = DOLPHINBOT_SITE_CONTEXT;
      if (websiteData.articles.length) ctx += `\nARTICLES: ${websiteData.articles.slice(0, 5).map(a => a.title).join(', ')}`;
      if (websiteData.events.length) ctx += `\nEVENTS: ${websiteData.events.slice(0, 5).map(e => e.title).join(', ')}`;

      const payloadMessages = [
        { role: 'system', content: ctx },
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageToSend },
      ];

      const reply = await chatService.sendMessage({
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 200,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      const reply = resolveDolphinbotOfflineReply(lowerMessage, {
        articles: websiteData.articles,
        events: websiteData.events,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { icon: '🔍', text: "Search articles" },
    { icon: '📅', text: "Show events" },
    { icon: '👥', text: "The team" }
  ];

  // Theme-based colors
  const theme = isDark ? {
    popup: 'linear-gradient(165deg, rgba(13, 27, 42, 0.92) 0%, rgba(27, 38, 59, 0.95) 100%)',
    popupBorder: 'rgba(0, 180, 216, 0.2)',
    popupShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 180, 216, 0.1)',
    header: 'linear-gradient(180deg, rgba(0, 180, 216, 0.15) 0%, rgba(0, 119, 182, 0.08) 100%)',
    headerBorder: 'rgba(0, 180, 216, 0.12)',
    title: '#ffffff',
    subtitle: 'rgba(255,255,255,0.7)',
    closeBtn: 'rgba(255,255,255,0.1)',
    closeBtnText: 'rgba(255,255,255,0.7)',
    botBubble: 'linear-gradient(135deg, rgba(0, 180, 216, 0.18) 0%, rgba(0, 119, 182, 0.12) 100%)',
    botText: '#e0f7fa',
    botBorder: 'rgba(0, 180, 216, 0.2)',
    inputBg: 'rgba(0, 180, 216, 0.08)',
    inputBorder: 'rgba(0, 180, 216, 0.2)',
    inputText: '#ffffff',
    inputPlaceholder: 'rgba(255,255,255,0.4)',
    inputArea: 'rgba(0, 15, 30, 0.5)',
    chipBg: 'rgba(0, 180, 216, 0.12)',
    chipBorder: 'rgba(0, 180, 216, 0.25)',
    chipText: '#90e0ef',
    hintBg: 'rgba(255, 255, 255, 0.95)',
    hintText: '#1a5f6a',
  } : {
    popup: 'linear-gradient(165deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 250, 255, 0.98) 100%)',
    popupBorder: 'rgba(0, 150, 180, 0.15)',
    popupShadow: '0 25px 80px rgba(0, 0, 0, 0.12), 0 0 60px rgba(0, 180, 216, 0.08)',
    header: 'linear-gradient(180deg, rgba(0, 180, 216, 0.12) 0%, rgba(0, 150, 180, 0.06) 100%)',
    headerBorder: 'rgba(0, 150, 180, 0.1)',
    title: '#0d4a54',
    subtitle: '#4a8a94',
    closeBtn: 'rgba(0, 0, 0, 0.05)',
    closeBtnText: '#4a8a94',
    botBubble: 'rgba(255, 255, 255, 0.9)',
    botText: '#1a3a40',
    botBorder: 'rgba(0, 150, 180, 0.15)',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputBorder: 'rgba(0, 150, 180, 0.2)',
    inputText: '#1a3a40',
    inputPlaceholder: '#7ab8c4',
    inputArea: 'rgba(240, 250, 255, 0.7)',
    chipBg: 'rgba(0, 180, 216, 0.1)',
    chipBorder: 'rgba(0, 150, 180, 0.2)',
    chipText: '#0096c7',
    hintBg: 'rgba(255, 255, 255, 0.95)',
    hintText: '#1a5f6a',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .chat-widget-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Deep Ocean Glass Theme - High Visibility */
        .chat-fab {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          
          /* Deep Blue Gradient */
          background: linear-gradient(135deg, #023e8a, #0096c7);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 8px 25px rgba(2, 62, 138, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.2);
        }

        /* Glass Shine */
        .chat-fab::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Hover Effect */
        .chat-fab:hover { 
          transform: translateY(-4px) scale(1.05);
          background: linear-gradient(135deg, #0077b6, #00b4d8);
          box-shadow: 0 15px 35px rgba(0, 150, 199, 0.5);
        }

        /* Active/Close State - Light Blue Glass (matching wave button) */
        .chat-fab.active { 
          background: linear-gradient(135deg, #0077b6, #00b4d8);
          transform: rotate(180deg);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 
            0 8px 25px rgba(0, 119, 182, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.15);
        }

        .fab-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          align-content: center; /* Ensure vertical center */
          width: 100%; /* Ensure full width */
          height: 100%; /* Ensure full height */
        }

        /* Bright White Wave */
        .wave-svg {
          width: 32px;
          height: 32px;
          fill: none;
          stroke: #ffffff; /* Contrast against dark blue */
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.5));
          transition: all 0.4s ease;
          margin: auto; /* Force center */
          display: block;
        }

        .chat-fab:hover .wave-path {
          animation: waveLiquid 2s ease-in-out infinite;
        }

        @keyframes waveLiquid {
          0%, 100% { d: path("M4 12C4 12 8 8 12 8C16 8 20 12 20 12"); stroke: #ffffff; }
          50% { d: path("M4 12C4 12 8 16 12 16C16 16 20 12 20 12"); stroke: #caf0f8; }
        }

        /* Solid White X - Clearly Visible */
        .close-icon {
          font-size: 28px;
          color: #ffffff;
          font-weight: 300;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .fab-icon { font-size: 30px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        .chat-fab:hover .fab-icon { animation: swim 0.6s ease-in-out; }

        @keyframes swim {
          0%, 100% { transform: rotate(0) translateY(0); }
          25% { transform: rotate(-10deg) translateY(-3px); }
          75% { transform: rotate(10deg) translateY(3px); }
        }

        .fab-hint {
          position: absolute;
          right: 76px;
          top: 50%;
          transform: translateY(-50%);
          background: ${theme.hintBg};
          backdrop-filter: blur(12px);
          padding: 12px 18px;
          border-radius: 16px;
          border: 1px solid rgba(0, 150, 180, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          font-size: 0.85rem;
          color: ${theme.hintText};
          white-space: nowrap;
          animation: hintSlide 0.4s ease-out;
          font-weight: 600;
        }

        .fab-hint::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          border-left: 10px solid ${theme.hintBg};
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
        }

        @keyframes hintSlide {
          from { opacity: 0; transform: translateY(-50%) translateX(10px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .chat-popup {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 380px;
          height: 520px;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: popupOpen 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          background: ${theme.popup};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${theme.popupBorder};
          box-shadow: ${theme.popupShadow};
        }

        @keyframes popupOpen {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .chat-header {
          padding: 18px 20px;
          background: ${theme.header};
          border-bottom: 1px solid ${theme.headerBorder};
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* Premium Wave Logo Container */
        .header-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          /* Deep Ocean Gradient */
          background: linear-gradient(135deg, #023e8a, #0077b6, #00b4d8);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 8px 15px rgba(2, 62, 138, 0.4), 
            inset 0 4px 6px rgba(255, 255, 255, 0.4);
          animation: avatarFloat 3s ease-in-out infinite;
        }

        /* Artistic Perfect Wave SVG */
        .wave-logo-svg {
          width: 28px;
          height: 28px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .header-info { flex: 1; }
        .header-info h3 { margin: 0; color: ${theme.title}; font-size: 1.15rem; font-weight: 700; }
        .header-status { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .status-dot { width: 8px; height: 8px; background: #06d6a0; border-radius: 50%; box-shadow: 0 0 8px #06d6a0; animation: statusPulse 2s infinite; }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .header-status span { color: ${theme.subtitle}; font-size: 0.75rem; font-weight: 500; }

        .close-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${theme.closeBtn};
          border: 1px solid transparent;
          color: ${theme.closeBtnText};
          font-size: 18px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover { background: rgba(239, 71, 111, 0.2); color: #ef476f; transform: rotate(90deg); }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 150, 180, 0.3) transparent;
        }

        .messages-area::-webkit-scrollbar { width: 5px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(0, 150, 180, 0.3); border-radius: 3px; }

        .message-bubble {
          max-width: 85%;
          padding: 14px 18px;
          border-radius: 20px;
          font-size: 0.9rem;
          line-height: 1.55;
          animation: messageIn 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          white-space: pre-wrap;
        }

        @keyframes messageIn {
          from { opacity: 0; transform: scale(0.85) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .message-bubble.bot {
          align-self: flex-start;
          background: ${theme.botBubble};
          backdrop-filter: blur(8px);
          color: ${theme.botText};
          border: 1px solid ${theme.botBorder};
          border-bottom-left-radius: 6px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .message-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%);
          color: white;
          border: none;
          border-bottom-right-radius: 6px;
          box-shadow: 0 6px 20px rgba(0, 150, 180, 0.3);
        }

        .typing-bubble { display: flex; gap: 6px; padding: 16px 20px; }
        .typing-dot {
          width: 10px;
          height: 10px;
          background: linear-gradient(145deg, #00b4d8, #0096c7);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .quick-actions {
          padding: 14px 16px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          border-top: 1px solid ${theme.headerBorder};
        }

        .quick-actions::-webkit-scrollbar { display: none; }

        .quick-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: ${theme.chipBg};
          border: 1px solid ${theme.chipBorder};
          border-radius: 24px;
          color: ${theme.chipText};
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
        }

        .quick-chip:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 150, 180, 0.15);
        }

        .input-area {
          padding: 16px 18px;
          background: ${theme.inputArea};
          backdrop-filter: blur(12px);
          border-top: 1px solid ${theme.headerBorder};
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .message-input {
          flex: 1;
          padding: 14px 20px;
          background: ${theme.inputBg};
          border: 1px solid ${theme.inputBorder};
          border-radius: 20px;
          color: ${theme.inputText};
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
          font-family: inherit;
        }

        .message-input::placeholder { color: ${theme.inputPlaceholder}; }
        .message-input:focus { border-color: rgba(0, 150, 180, 0.5); box-shadow: 0 0 0 4px rgba(0, 180, 216, 0.1); }

        .send-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(145deg, #00b4d8 0%, #0096c7 100%);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(0, 150, 180, 0.3);
        }

        .send-btn:hover:not(:disabled) { transform: scale(1.1); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 480px) {
          .chat-widget-wrapper { bottom: 16px; right: 16px; }
          .chat-popup { width: calc(100vw - 32px); height: calc(100vh - 120px); max-height: 600px; }
          .fab-hint { display: none; }
        }
      `}</style>

      <div className="chat-widget-wrapper" ref={widgetRef}>
        {isOpen && (
          <div className="chat-popup">
            <div className="chat-header">
              <div className="header-avatar">
                {/* Perfect Wave Logo */}
                <svg className="wave-logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 17.5C22 17.5 19 14 15 14C11 14 10 18 6 18C2 18 2 15.5 2 15.5" strokeDasharray="30" strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" from="30" to="0" dur="2s" fill="freeze" />
                  </path>
                  <path d="M22 13C22 13 18.5 9 14 9C9.5 9 8.5 14 4.5 14C2 14 2 12.5 2 12.5" opacity="0.6" />
                  <path d="M22 8.5C22 8.5 19 6 15.5 6C12 6 11 9 8 9C6 9 5 8 5 8" opacity="0.4" />
                </svg>
              </div>
              <div className="header-info">
                <h3>dolphinbot</h3>
                <div className="header-status">
                  <div className="status-dot"></div>
                  <span>{formatConversationStats(messages)}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="messages-area">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-bubble ${msg.role === 'assistant' ? 'bot' : 'user'}`}>
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="message-bubble bot typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <input
                ref={inputRef}
                className="message-input"
                placeholder="Search or ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
              >
                ➤
              </button>
            </div>
          </div>
        )}

        {!isOpen && showHint && (
          <div className="fab-hint">🐬 Parler à dolphinbot</div>
        )}

        <button
          className={`chat-fab ${isOpen ? 'active' : ''}`}
          onClick={() => { setIsOpen(!isOpen); setShowHint(false); }}
        >
          <div className="fab-content">
            {isOpen ? (
              <span className="close-icon">✕</span>
            ) : (
              <svg className="wave-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  className="wave-path"
                  d="M4 12C4 12 8 8 12 8C16 8 20 12 20 12"
                />
              </svg>
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default ChatWidget;
