-- Sharing during sales consumes one board allowance, independently of drawing numbers.
-- Existing published_at, number locks, scoring, and finalized snapshot contracts stay intact.
ALTER TABLE public.contests ADD COLUMN shared_at timestamptz;

ALTER POLICY "Organizer can delete owned draft contests" ON public.contests
  USING ((SELECT auth.uid()) = owner_id
    AND status IN ('draft', 'reconciling', 'ready')
    AND shared_at IS NULL AND published_at IS NULL);

CREATE FUNCTION public.gridone_validate_sales_board(p_board jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF jsonb_typeof(p_board) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_board->'squares') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_board->'squares') <> 100 THEN
    RAISE EXCEPTION 'The board must contain exactly 100 squares';
  END IF;
  IF p_board->'isDynamic' = 'true'::jsonb THEN
    RAISE EXCEPTION 'Legacy dynamic boards require a preservation plan before sharing';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_board->'squares') cell(value)
    WHERE jsonb_typeof(value) IS DISTINCT FROM 'array'
       OR jsonb_array_length(value) > 1
       OR (jsonb_array_length(value) = 1 AND (
         jsonb_typeof(value->0) IS DISTINCT FROM 'string'
         OR char_length(value->>0) NOT BETWEEN 1 AND 80
         OR value->>0 <> btrim(value->>0)))) THEN
    RAISE EXCEPTION 'Every square must be unsold or contain one trimmed buyer name';
  END IF;
  IF p_board ? 'allocationLabels' THEN
    IF jsonb_typeof(p_board->'allocationLabels') IS DISTINCT FROM 'array'
      OR jsonb_array_length(p_board->'allocationLabels') <> 100 THEN
      RAISE EXCEPTION 'Public allocations must contain exactly 100 labels';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_board->'allocationLabels') label(value)
      WHERE value <> 'null'::jsonb AND (
        jsonb_typeof(value) IS DISTINCT FROM 'string'
        OR char_length(value#>>'{}') NOT BETWEEN 1 AND 80
        OR value#>>'{}' <> btrim(value#>>'{}'))) THEN
      RAISE EXCEPTION 'Public allocation labels must be null or trimmed text of 1-80 characters';
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_validate_sales_board(jsonb) FROM PUBLIC;
-- The validating trigger runs as the writer and needs this pure validator.
GRANT EXECUTE ON FUNCTION public.gridone_validate_sales_board(jsonb) TO authenticated, service_role;

CREATE FUNCTION public.gridone_protect_sales_sharing()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.shared_at IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND NEW.shared_at IS DISTINCT FROM OLD.shared_at) THEN
    IF current_user IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'Use the organizer sharing endpoint to share a board';
    END IF;
    IF NEW.shared_at IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.board_activations activation WHERE activation.contest_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Sharing requires a reserved board allowance';
    END IF;
  END IF;
  IF NEW.published_at IS NULL AND (NEW.shared_at IS NOT NULL OR NEW.board_data ? 'allocationLabels') THEN
    PERFORM public.gridone_validate_sales_board(NEW.board_data);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.shared_at IS NOT NULL THEN
    IF (
      NEW.share_code IS DISTINCT FROM OLD.share_code
      OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
      OR NEW.season_year IS DISTINCT FROM OLD.season_year
    ) THEN
      RAISE EXCEPTION 'Shared board identity is locked';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.published_at IS NULL AND NEW.published_at IS NOT NULL
    AND OLD.board_data->'isDynamic' = 'true'::jsonb THEN
    RAISE EXCEPTION 'Legacy dynamic boards require a preservation plan before finalizing';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_protect_sales_sharing() FROM PUBLIC;
CREATE TRIGGER gridone_protect_sales_sharing BEFORE INSERT OR UPDATE ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.gridone_protect_sales_sharing();

CREATE FUNCTION public.gridone_share_board(
  p_contest_id uuid, p_owner_id uuid, p_expected_revision bigint
) RETURNS TABLE (shared boolean, share_code text, next_revision bigint, shared_at timestamptz,
  tier text, used integer, allowance integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  current_contest public.contests%ROWTYPE;
  updated_contest public.contests%ROWTYPE;
  entitlement_row public.season_entitlements%ROWTYPE;
  used_count integer := 0;
  already_activated boolean := false;
BEGIN
  SELECT * INTO current_contest FROM public.contests contest
    WHERE contest.id = p_contest_id AND contest.owner_id = p_owner_id FOR UPDATE;
  IF NOT FOUND OR current_contest.revision <> p_expected_revision THEN RETURN; END IF;
  IF current_contest.published_at IS NOT NULL OR current_contest.status NOT IN ('draft','reconciling','ready') THEN
    RAISE EXCEPTION 'Only a board in preparation can start sharing during sales';
  END IF;
  IF current_contest.game_external_id IS NULL THEN
    RAISE EXCEPTION 'Link a scheduled NFL game before sharing';
  END IF;
  PERFORM public.gridone_validate_sales_board(current_contest.board_data);
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_owner_id::text || ':' || current_contest.season_year::text,
      0
    )
  );

  INSERT INTO public.season_entitlements (
    owner_id,
    season_year,
    status,
    tier,
    boards_allowance,
    price_cents,
    currency
  )
  VALUES (
    p_owner_id,
    current_contest.season_year,
    'active',
    'free',
    1,
    0,
    'usd'
  )
  ON CONFLICT (owner_id, season_year) DO NOTHING;

  SELECT *
    INTO entitlement_row
  FROM public.season_entitlements entitlement
  WHERE entitlement.owner_id = p_owner_id
    AND entitlement.season_year = current_contest.season_year
  FOR UPDATE;

  SELECT count(*)::integer
    INTO used_count
  FROM public.board_activations activation
  WHERE activation.entitlement_id = entitlement_row.id;

  SELECT EXISTS (
    SELECT 1
    FROM public.board_activations activation
    WHERE activation.contest_id = current_contest.id
  ) INTO already_activated;

  IF NOT already_activated THEN
    IF entitlement_row.status <> 'active' THEN
      RAISE EXCEPTION USING
        MESSAGE = format(
          'PUBLISH_ENTITLEMENT_INACTIVE:%s:%s:%s',
          entitlement_row.tier,
          used_count,
          entitlement_row.boards_allowance
        ),
        ERRCODE = 'P0001';
    END IF;

    IF used_count >= entitlement_row.boards_allowance THEN
      RAISE EXCEPTION USING
        MESSAGE = format(
          'PUBLISH_ALLOWANCE_EXHAUSTED:%s:%s:%s',
          entitlement_row.tier,
          used_count,
          entitlement_row.boards_allowance
        ),
        ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.board_activations (entitlement_id, contest_id)
    VALUES (entitlement_row.id, current_contest.id);
    used_count := used_count + 1;
  END IF;

  IF current_contest.shared_at IS NULL THEN
    UPDATE public.contests contest SET shared_at = now()
      WHERE contest.id = current_contest.id RETURNING contest.* INTO updated_contest;
    INSERT INTO public.contest_audit_events
      (contest_id, actor_id, event_type, previous_revision, next_revision, details)
    VALUES (current_contest.id, p_owner_id, 'board.shared', current_contest.revision,
      updated_contest.revision, jsonb_build_object('share_code', current_contest.share_code,
        'tier', entitlement_row.tier, 'used', used_count, 'allowance', entitlement_row.boards_allowance));
  ELSE
    updated_contest := current_contest;
  END IF;
  RETURN QUERY SELECT true, updated_contest.share_code, updated_contest.revision,
    updated_contest.shared_at, entitlement_row.tier, used_count, entitlement_row.boards_allowance::integer;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_share_board(uuid, uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gridone_share_board(uuid, uuid, bigint) TO service_role;

-- Keep explicitly public allocations on finalized boards without exposing the private seller ledger.
CREATE FUNCTION public.gridone_project_public_allocations()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE allocations jsonb;
BEGIN
  SELECT board_data->'allocationLabels' INTO allocations FROM public.contests WHERE id = NEW.contest_id;
  IF allocations IS NOT NULL THEN
    NEW.board := NEW.board || jsonb_build_object('allocationLabels', allocations);
  ELSE
    NEW.board := NEW.board - 'allocationLabels';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_project_public_allocations() FROM PUBLIC;
CREATE TRIGGER gridone_project_public_allocations BEFORE INSERT OR UPDATE OF board ON public.public_board_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.gridone_project_public_allocations();
