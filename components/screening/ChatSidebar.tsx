import React from 'react';
import { Message } from './types';

interface ChatSidebarProps {
  messages: Message[];
  agentTyping: boolean;
  screeningProgress: number;
  allStepsWithStatus: any[];
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  agentTyping,
  screeningProgress,
  allStepsWithStatus,
  chatEndRef,
}) => (
  <div className="transition-all duration-500 ease-in-out w-96 overflow-hidden">
    <div className="flex flex-col h-full rounded-xl border border-gray-700 shadow-xl bg-gray-900/95 p-0">
      {/* Chat Header, Progress, Step Indicators, Messages, Typing Indicator */}
      {/* ...existing code... */}
      <div ref={chatEndRef} />
    </div>
  </div>
);
