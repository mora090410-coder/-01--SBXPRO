
export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const dates = url.searchParams.get('dates');
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard${dates ? `?dates=${dates}` : ''}`;

    try {
      const response = await fetch(espnUrl, {
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Failed to fetch ESPN data', message: err.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }
  },
};
