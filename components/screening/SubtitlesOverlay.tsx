import React from 'react';
import { Message } from './types';
import styles from './screening-interface.module.css';

interface SubtitlesOverlayProps {
  ccEnabled: boolean;
  messages: Message[];
  agentTyping: boolean;
}

export const SubtitlesOverlay: React.FC<SubtitlesOverlayProps> = ({
  ccEnabled,
  messages,
  agentTyping,
}) => {
  if (!ccEnabled) return null;
  const lastMsgs = messages.slice(-3);
  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 w-full flex justify-center pointer-events-none">
      <div className={`${styles['subtitle-cc']} flex flex-col gap-1`}>
        {lastMsgs.map((msg, idx) => {
          if (msg.sender === 'agent' && idx === lastMsgs.length - 1 && agentTyping) {
            return (
              <div key={msg.id + idx} className="flex items-center justify-center gap-2 text-blue-300 w-full overflow-hidden whitespace-nowrap">
                <span>Agent:</span>
                <span className={styles['typing-dots']}>
                  <span className={styles['dot']}>.</span>
                  <span className={styles['dot']}>.</span>
                  <span className={styles['dot']}>.</span>
                </span>
              </div>
            );
          }
          return (
            <div
              key={msg.id + idx}
              className={`w-full overflow-hidden text-ellipsis whitespace-nowrap ${msg.sender === 'agent' ? 'text-blue-300' : 'text-green-200'}`}
              title={msg.content}
            >
              {msg.sender === 'agent' ? 'Agent: ' : 'You: '}{msg.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
