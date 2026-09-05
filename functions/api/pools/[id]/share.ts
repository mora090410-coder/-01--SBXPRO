import { createClient } from '@supabase/supabase-js';
import { nextUpgradeTier, type PricingTier } from '../../../_lib/pricingTiers';

type PagesFunction = (context: any) => Promise<Response> | Response;

export const onRequestPost: PagesFunction = async ({ request, env, params }) => {
  try {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: 'Board sharing is not configured.' }, { status: 503 });
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return Response.json({ error: 'Sign in before sharing.' }, { status: 401 });
    const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData } = await auth.auth.getUser(token);
    if (!authData.user) return Response.json({ error: 'Your session has expired.' }, { status: 401 });
    if (!authData.user.email || !authData.user.email_confirmed_at) {
      return Response.json({ error: 'Verify your email before sharing your board.' }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    if (!Number.isInteger(body?.revision) || body.revision < 1) {
      return Response.json({ error: 'A current board revision is required.' }, { status: 409 });
    }
    const id = String(params.id || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: 'Invalid board ID.' }, { status: 400 });
    }
    const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.rpc('gridone_share_board', {
      p_contest_id: id,
      p_owner_id: authData.user.id,
      p_expected_revision: body.revision,
    });
    if (error) {
      const message = error.message || 'The board could not be shared.';
      const allowanceMatch = message.match(/PUBLISH_(ALLOWANCE_EXHAUSTED|ENTITLEMENT_INACTIVE):([^:]+):(\d+):(\d+)/i);
      if (allowanceMatch) {
        const [, reason, tierValue, usedValue, allowanceValue] = allowanceMatch;
        const tier = tierValue.toLowerCase() as PricingTier;
        const upgradeTo = reason.toUpperCase() === 'ENTITLEMENT_INACTIVE'
          ? tier === 'org' ? 'org' : 'gameday'
          : nextUpgradeTier(tier);
        return Response.json({
          code: `PUBLISH_${reason.toUpperCase()}`,
          error: 'Your current plan has no board allowance available. Review your plan to share another board.',
          tier, used: Number(usedValue), allowance: Number(allowanceValue), upgradeTo,
        }, { status: 402 });
      }
      const validationError = /^(Only a board|Link a scheduled|The board must|Legacy dynamic|Every square|Public allocation)/i.test(message);
      return Response.json({ error: validationError ? message : 'The board could not be shared. Please try again.' }, {
        status: validationError ? 409 : 500,
      });
    }
    const shared = Array.isArray(data) ? data[0] : data;
    if (!shared) return Response.json({
      error: 'This board changed before sharing. Reload and try again.', code: 'REVISION_CONFLICT',
    }, { status: 409 });
    return Response.json({
      shared: true,
      sharedAt: shared.shared_at,
      shareCode: shared.share_code,
      viewerUrl: `/b/${shared.share_code}`,
      revision: shared.next_revision,
      tier: shared.tier,
      used: Number(shared.used),
      allowance: Number(shared.allowance),
    });
  } catch {
    return Response.json({ error: 'The board could not be shared. Please try again.' }, { status: 500 });
  }
};
