// Cloudflare Pages Functions environment types
interface KVNamespace {
    get(key: string, type?: "text" | "json" | "arrayBuffer" | "stream"): Promise<any>;
    put(key: string, value: string | ReadableStream | ArrayBuffer | FormData, options?: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: any): Promise<any>;
}

type PagesFunction<Env = any> = (context: {
    request: Request;
    env: Env;
    params: any;
    data: any;
    next: any;
    functionPath: string;
    waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;

interface Env {
    POOLS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const rawData = await context.request.json() as { email?: string };

        if (!rawData.email || typeof rawData.email !== 'string' || !rawData.email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Valid email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const emailToFind = rawData.email.toLowerCase().trim();
        console.log(`[RECOVERY] Searching for pools owned by: ${emailToFind}`);

        // Scan all pools (Note: In production with many users, use a secondary index/KV key "email:poolId")
        const list = await context.env.POOLS.list({ prefix: 'pool:' });
        const foundPools: { id: string, title: string }[] = [];

        for (const key of list.keys) {
            const poolDataStr = await context.env.POOLS.get(key.name);
            if (poolDataStr) {
                try {
                    const pool = JSON.parse(poolDataStr);
                    // Check if pool has data and adminEmail matches
                    if (pool.data && pool.data.adminEmail && pool.data.adminEmail.toLowerCase() === emailToFind) {
                        foundPools.push({
                            id: pool.poolId,
                            title: pool.data.game.title
                        });
                    }
                } catch (e) {
                    // Ignore malformed JSON
                }
            }
        }

        if (foundPools.length > 0) {
            // Mock Email Service
            const poolListString = foundPools.map(p => `- ${p.title} (ID: ${p.id})`).join('\n');
            console.log(`
      ================================================
      MOCK EMAIL SERVICE - SENDING RECOVERY
      ================================================
      To: ${emailToFind}
      Subject: Your SBX Board Recovery

      Hello there,

      It looks like you forgot your Board IDs. Here are the boards associated with your email:

      ${poolListString}

      Visit https://sbxpro.pages.dev/ to log in.
      ================================================
      `);
            return new Response(JSON.stringify({ success: true, message: 'If any boards match that email, we have sent a recovery email.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            console.log(`[RECOVERY] No pools found for ${emailToFind}`);
            // Security: Always return same message to prevent email enumeration
            return new Response(JSON.stringify({ success: true, message: 'If any boards match that email, we have sent a recovery email.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (err: any) {
        console.error('Recovery error:', err);
        return new Response(JSON.stringify({ error: 'Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
