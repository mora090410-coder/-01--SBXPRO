
// Fix: Define missing types for Cloudflare Pages environment
type KVNamespace = any;
type PagesFunction<T = any> = (context: any) => Promise<Response> | Response;

interface Env {
  POOLS: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Extract the adminToken from the Authorization header (Bearer [token])
    const authHeader = context.request.headers.get('Authorization');
    const adminToken = authHeader?.replace('Bearer ', '') || '';

    const data = await context.request.json();
    
    if (!data) throw new Error("Missing payload data");

    // Generate an 8-character safe ID
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let poolId = '';
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 8; i++) {
      poolId += chars[randomValues[i] % chars.length];
    }

    const payload = {
      poolId,
      adminToken, // Include captured adminToken as a top-level property
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data
    };

    // Store in KV
    await context.env.POOLS.put(`pool:${poolId}`, JSON.stringify(payload));

    return new Response(JSON.stringify({ poolId, success: true }), {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to create pool', message: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
