import { NextApiRequest, NextApiResponse } from 'next';
import { generateBuildings } from '../../utils/ai';
import { BuildingSpec } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { colonyName, theme, existingBuildings } = req.body;

    if (!colonyName) {
      return res.status(400).json({ error: 'Colony name is required' });
    }

    const buildings = await generateBuildings(
      colonyName, 
      theme || 'Neo-Colony on a terraformed moon', 
      existingBuildings || []
    );

    return res.status(200).json({ buildings });
  } catch (error) {
    console.error('Error generating buildings:', error);
    return res.status(500).json({ 
      error: 'Failed to generate buildings',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 