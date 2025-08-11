// This is your new serverless function that will run on Vercel, not in the browser.
// It safely handles your API key and communicates with the Google AI.

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = request.body;

    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    // This is where the magic happens. Vercel makes your environment variable available here.
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    
    const payload = {
        instances: [{ prompt: prompt }],
        parameters: { "sampleCount": 1 }
    };

    // Call the Google AI API from the server
    const googleApiResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!googleApiResponse.ok) {
      const errorBody = await googleApiResponse.text();
      console.error("Google API Error:", errorBody);
      throw new Error(`Google API failed with status ${googleApiResponse.status}`);
    }

    const result = await googleApiResponse.json();

    if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
        const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        // Send the successful image URL back to the front-end
        return response.status(200).json({ imageUrl });
    } else {
        throw new Error("Invalid response structure from Google API.");
    }

  } catch (error) {
    console.error('Error in serverless function:', error);
    // Send an error response back to the front-end
    return response.status(500).json({ error: 'Failed to generate image.' });
  }
}
