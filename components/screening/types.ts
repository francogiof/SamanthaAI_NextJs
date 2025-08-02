// Shared types for the screening interface module

export interface Message {
  id: string;
  sender: 'agent' | 'candidate';
  content: string;
  timestamp: Date;
}

export interface AgentSlide {
  id: string;
  type: 'introduction' | 'requirements' | 'questions' | 'feedback';
  content: any;
}

// Add more shared types/interfaces as needed
