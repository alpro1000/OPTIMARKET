// API Endpoint: Use new pipeline module for recommendations
// Location: api/recommend.js (или переопределить /api/generate)

import pipeline from '../modules/pipeline.js';

export default async function handler(req, res) {
  try {
    const { category = 'drills', query = 'professional' } = req.query;

    console.log(`📦 Search: "${query}" in ${category}`);

    // Initialize pipeline if needed
    if (!pipeline.isInitialized) {
      await pipeline.initialize();
    }

    // Use new pipeline search
    const results = await pipeline.search(query, category);

    // Return formatted response
    res.status(200).json({
      success: true,
      query,
      category,
      results: {
        premium: results.premium || [],
        optimum: results.optimum || [],
        economy: results.economy || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(200).json({
      success: false,
      error: error.message,
      // Fallback: return mock data
      results: {
        premium: [{
          id: 'mock-1',
          name: 'Premium Product',
          price: 500,
          rating: 4.8,
          trust_score: 92
        }],
        optimum: [{
          id: 'mock-2',
          name: 'Optimum Product',
          price: 300,
          rating: 4.6,
          trust_score: 90
        }],
        economy: [{
          id: 'mock-3',
          name: 'Economy Product',
          price: 150,
          rating: 4.2,
          trust_score: 82
        }]
      }
    });
  }
}
