
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

/**
 * Public Access Route
 * Allows players to view the board without a password.
 * Sanitizes sensitive adminToken from output.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const poolId = context.params.id as string;
  const val = await context.env.POOLS.get(`pool:${poolId}`);

  if (!val) {
    return new Response(JSON.stringify({ error: 'Pool not found' }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const parsed = JSON.parse(val);
  
  // Security Sanitization: Remove adminToken so public users cannot see it.
  const { adminToken: _, ...publicPayload } = parsed;

  return new Response(JSON.stringify(publicPayload), {
    status: 200,
    headers: { 
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
  });
};

/**
 * Verification Route
 * Handshake for Commissioner Hub login.
 * Compares Bearer token to stored adminToken.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const poolId = context.params.id as string;
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Token' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const val = await context.env.POOLS.get(`pool:${poolId}`);
  if (!val) {
    return new Response(JSON.stringify({ error: 'Pool not found' }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const parsed = JSON.parse(val);

  if (token !== parsed.adminToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Password' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, message: 'Authentication Verified' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

/**
 * Protected Update Route
 * Verifies Authorization token matches stored adminToken before persisting changes.
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const poolId = context.params.id as string;
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Token' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const existing = await context.env.POOLS.get(`pool:${poolId}`);
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Pool not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parsed = JSON.parse(existing);

    // Strict Verification: Provided token must match stored adminToken
    if (token !== parsed.adminToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await context.request.json();
    const updated = {
      ...parsed,
      updatedAt: new Date().toISOString(),
      data
    };

    await context.env.POOLS.put(`pool:${poolId}`, JSON.stringify(updated));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to update pool', message: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
