"use client";

import React, { useEffect, useRef } from 'react';
import { ChatMessage, Villager } from '../utils/types';

interface ChatOverlayProps {
  messages: ChatMessage[];
  villagers: {
    [key: string]: Villager;
  };
  onSendMessage?: (message: string) => void;
  activeVillagerId?: string;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
  messages, 
  villagers,
  onSendMessage,
  activeVillagerId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get last 4 messages for display
  const lastMessages = messages.slice(-4);
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get villager name by ID
  const getVillagerName = (id: string) => {
    return villagers[id]?.name || 'Unknown';
  };
  
  // Get message EQ color based on villager's EQ
  const getEqColor = (id: string) => {
    const villager = villagers[id];
    if (!villager) return 'text-white';
    
    if (villager.eq >= 80) return 'text-neon-green';
    if (villager.eq >= 60) return 'text-neon-blue';
    if (villager.eq >= 40) return 'text-white';
    if (villager.eq >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputRef.current && inputRef.current.value.trim() && onSendMessage) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 w-80 bg-black/70 backdrop-blur-md rounded-lg border border-neon-blue/30 overflow-hidden shadow-lg">
      <div className="p-3 bg-gray-900/50 border-b border-gray-800">
        <h3 className="text-neon-blue font-medium">Colony Communications</h3>
        {activeVillagerId && (
          <p className="text-xs text-gray-400 mt-0.5">
            Chatting with: <span className="text-white">{getVillagerName(activeVillagerId)}</span>
          </p>
        )}
      </div>
      
      <div className="p-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {lastMessages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm italic">No communications yet.</p>
        ) : (
          lastMessages.map((msg, idx) => (
            <div key={idx} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className={`font-medium ${getEqColor(msg.senderId)}`}>
                  {getVillagerName(msg.senderId)}
                </span>
                <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
              </div>
              <p className="text-gray-300 text-sm">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {onSendMessage && activeVillagerId && (
        <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue"
          />
          <button
            type="submit"
            className="bg-neon-blue/30 hover:bg-neon-blue/50 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatOverlay; 