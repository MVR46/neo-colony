import { NextApiRequest, NextApiResponse } from 'next';
import { generateStatusReport } from '../../utils/ai';
import { Villager, Colony } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { villagerId, buildingId, villager, colony } = req.body;

    if (!villagerId || !villager) {
      return res.status(400).json({ error: 'Villager information is required' });
    }

    if (!colony) {
      return res.status(400).json({ error: 'Colony information is required' });
    }

    const statusReport = await generateStatusReport(
      villager as Villager,
      colony as Colony
    );

    return res.status(200).json(statusReport);
  } catch (error) {
    console.error('Error generating status report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate status report',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 