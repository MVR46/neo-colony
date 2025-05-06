import { NextApiRequest, NextApiResponse } from 'next';
import { generateBuildings, generateVillager } from '../../utils/ai';
import { BuildingSpec } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { colonyName, theme, existingBuildings, buildings } = req.body;

    if (!colonyName) {
      return res.status(400).json({ error: 'Colony name is required' });
    }

    // If we're generating a villager (determined by presence of 'buildings' array)
    if (buildings) {
      const villager = await generateVillager(colonyName, buildings);
      return res.status(200).json(villager);
    } 
    // Otherwise generate buildings
    else {
      const buildings = await generateBuildings(
        colonyName, 
        theme || 'Neo-Colony on a terraformed moon', 
        existingBuildings || []
      );
      return res.status(200).json({ buildings });
    }
  } catch (error) {
    console.error('Error in generate API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 