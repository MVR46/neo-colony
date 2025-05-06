import OpenAI from 'openai';
import { 
  BuildingSpec, 
  Villager, 
  ChatMessage,
  Colony,
  StatusResponse,
  ChatResponse
} from './types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateBuildings(colonyName: string, theme: string, currentBuildings: BuildingSpec[]): Promise<BuildingSpec[]> {
  const prompt = `Generate 3 futuristic Neo-Colony buildings for "${colonyName}".
    Theme: ${theme}
    Current buildings: ${JSON.stringify(currentBuildings)}
    
    Each building should have:
    - A creative futuristic name
    - An appropriate credit cost (50-500)
    - EQ impact (-5 to +10)
    - A sprite description (for placeholder)
    
    Format as JSON array of BuildingSpec objects.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an AI architect specializing in futuristic neo-colony designs. Generate building specifications that match the theme and balance gameplay." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content in response");
    
    const parsedContent = JSON.parse(content);
    return parsedContent.buildings || [];
  } catch (error) {
    console.error("Failed to parse generated buildings:", error);
    return [];
  }
}

export async function generateStatusReport(
  villager: Villager,
  colony: Colony
): Promise<StatusResponse> {
  const prompt = `Generate a status report from the perspective of ${villager.name}, a ${villager.role} with traits: ${villager.traits.join(", ")}. 
    Their emotional quotient (EQ) is ${villager.eq}/100.
    
    Colony stats:
    - Name: ${colony.name}
    - Credits: ${colony.credits}
    - Average EQ: ${colony.averageEq}
    - Buildings: ${Object.values(colony.buildings).map(b => b.name).join(", ")}
    
    Generate a brief status report with:
    1. A current status statement
    2. The general mood (positive, neutral, or negative)
    3. 1-2 insights about the colony's current state`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an AI assistant generating in-character status reports for a simulated colony." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content in response");
    
    return JSON.parse(content) as StatusResponse;
  } catch (error) {
    console.error("Failed to parse status report:", error);
    return {
      status: "Error generating status report",
      mood: "neutral",
      insights: ["System malfunction"]
    };
  }
}

export async function generateChat(
  initiatorVillager: Villager,
  targetVillager: Villager,
  messageContent: string
): Promise<ChatResponse> {
  // Prepare the conversation history
  const conversationHistory: ChatMessage[] = [
    ...initiatorVillager.memory.filter(m => 
      m.senderId === initiatorVillager.id || m.senderId === targetVillager.id
    ).slice(-10)
  ];

  // Create system message with context
  const systemMessage = `You are ${targetVillager.name}, a ${targetVillager.role} with the traits: ${targetVillager.traits.join(", ")}. 
    Your emotional state (EQ) is ${targetVillager.eq}/100, which affects your tone.
    You're responding to ${initiatorVillager.name}, a ${initiatorVillager.role}.
    Keep responses brief (1-2 sentences), conversational, and reflective of your EQ level.`;

  // Prepare messages for API call
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    ...conversationHistory.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content
    })),
    { role: "user", content: messageContent }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
  });

  const content = response.choices[0].message.content || "...";
  
  // Create new message
  const newMessage: ChatMessage = {
    senderId: targetVillager.id,
    role: "assistant",
    content,
    timestamp: Date.now()
  };

  // Add new message to memory
  const updatedMemory = [...targetVillager.memory, newMessage];

  return {
    message: newMessage,
    updatedMemory
  };
} 