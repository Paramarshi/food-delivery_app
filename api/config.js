// API endpoint to provide client configuration
export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Only send public environment variables to the client
    res.json({
        CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
        CLERK_FRONTEND_API: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || '',
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });
}

// NOTE: To enable Google Geocoding on the client, set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment
// Example (Windows PowerShell): $env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'your_key_here'