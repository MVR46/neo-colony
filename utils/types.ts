export interface BuildingSpec {
  name: string;
  cost: number;
  eqImpact: number;
  sprite: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface Villager {
  id: string;
  name: string;
  role: string;
  traits: string[];
  eq: number;
  x: number;
  y: number;
  memory: ChatMessage[];
  currentTarget?: { x: number, y: number };
}

export interface ChatMessage {
  senderId: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Colony {
  name: string;
  credits: number;
  buildings: {
    [key: string]: Building;
  };
  villagers: {
    [key: string]: Villager;
  };
  averageEq: number;
}

export interface Building extends BuildingSpec {
  id: string;
  gridX: number;
  gridY: number;
  occupants: string[];
}

export interface GenerateResponse {
  buildings: BuildingSpec[];
}

export interface StatusResponse {
  status: string;
  mood: "positive" | "neutral" | "negative";
  insights: string[];
}

export interface ChatResponse {
  message: ChatMessage;
  updatedMemory: ChatMessage[];
} 