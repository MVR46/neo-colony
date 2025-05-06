import { NextApiRequest, NextApiResponse } from 'next';
import { generateChat } from '../../utils/ai';
import { Villager } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, villagerId, villager, userRole } = req.body;

    if (!message || !villagerId || !villager) {
      return res.status(400).json({ error: 'Message, villager ID, and villager data are required' });
    }

    // Create mock user villager for the chat
    const userVillager: Villager = {
      id: 'user',
      name: userRole || 'Colony Administrator',
      role: userRole || 'Colony Administrator',
      traits: ['Authoritative', 'Responsible'],
      eq: 70,
      x: 0,
      y: 0,
      memory: villager.memory || []
    };

    const chatResponse = await generateChat(
      userVillager,
      villager as Villager,
      message
    );

    return res.status(200).json(chatResponse);
  } catch (error) {
    console.error('Error generating chat response:', error);
    return res.status(500).json({ 
      error: 'Failed to generate chat response',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 