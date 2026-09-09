-- Scoped helper sessions are separate from public share links and organizer accounts.
CREATE TABLE public.family_board_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label = btrim(label) AND char_length(label) BETWEEN 1 AND 80),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  cells integer[] NOT NULL CHECK (cardinality(cells) BETWEEN 1 AND 100 AND 0 <= ALL(cells) AND 99 >= ALL(cells) AND array_position(cells,NULL) IS NULL),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_board_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.family_board_access FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.family_board_access TO service_role;
CREATE INDEX family_board_access_contest_idx ON public.family_board_access(contest_id);

-- Validate optional public additions at the database boundary, including direct owner saves.
CREATE FUNCTION public.gridone_validate_participation()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE k text; v jsonb;
BEGIN
  IF NEW.board_data ? 'participation' THEN
    v := NEW.board_data->'participation';
    IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid participation details'; END IF;
    FOR k IN SELECT jsonb_object_keys(v) LOOP
      IF k NOT IN ('purpose','instructions','squarePrice') OR jsonb_typeof(v->k) IS DISTINCT FROM 'string'
        OR char_length(v->>k) > (CASE k WHEN 'purpose' THEN 280 WHEN 'instructions' THEN 500 ELSE 40 END) THEN
        RAISE EXCEPTION 'Invalid participation details';
      END IF;
    END LOOP;
  END IF;
  IF NEW.board_data ? 'availability' THEN
    v := NEW.board_data->'availability';
    IF jsonb_typeof(v) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid availability'; END IF;
    IF jsonb_array_length(v) <> 100 OR EXISTS (SELECT 1 FROM jsonb_array_elements(v) x(value)
      WHERE value NOT IN ('"unspecified"'::jsonb,'"available"'::jsonb,'"unavailable"'::jsonb)) THEN
      RAISE EXCEPTION 'Invalid availability';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_validate_participation() FROM PUBLIC;
CREATE TRIGGER gridone_validate_participation BEFORE INSERT OR UPDATE OF board_data ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.gridone_validate_participation();

-- An assignment change permanently invalidates intersecting credentials, even A -> B -> A.
CREATE FUNCTION public.gridone_revoke_changed_family_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.board_data->'allocationLabels' IS DISTINCT FROM OLD.board_data->'allocationLabels'
    OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    UPDATE public.family_board_access access SET revoked_at = clock_timestamp()
    WHERE access.contest_id = NEW.id AND access.revoked_at IS NULL AND (
      NEW.owner_id IS DISTINCT FROM OLD.owner_id OR EXISTS (SELECT 1 FROM unnest(access.cells) cell
        WHERE NEW.board_data->'allocationLabels'->cell IS DISTINCT FROM OLD.board_data->'allocationLabels'->cell));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_revoke_changed_family_access() FROM PUBLIC;
CREATE TRIGGER gridone_revoke_changed_family_access AFTER UPDATE OF board_data, owner_id ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.gridone_revoke_changed_family_access();

CREATE FUNCTION public.gridone_family_access(
  p_action text, p_contest_id uuid DEFAULT NULL, p_owner_id uuid DEFAULT NULL,
  p_expected_revision bigint DEFAULT NULL, p_label text DEFAULT NULL,
  p_token_hash text DEFAULT NULL, p_cells integer[] DEFAULT NULL, p_changes jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  target_id uuid;
  current_board public.contests%ROWTYPE;
  access_row public.family_board_access%ROWTYPE;
  next_board jsonb;
  changes_seen integer[] := '{}';
  cell integer;
  change jsonb;
  label_value text;
  next_revision bigint;
  archived_notes jsonb;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('invite','revoke','read','edit','reassign') THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
  IF p_action IN ('read','edit') THEN
    IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'family_access_denied'; END IF;
    -- Initial lookup obtains identity only; all authority is rechecked after the board lock.
    SELECT contest_id INTO target_id FROM public.family_board_access WHERE token_hash = p_token_hash;
    IF target_id IS NULL OR (p_contest_id IS NOT NULL AND p_contest_id <> target_id) THEN RAISE EXCEPTION 'family_access_denied'; END IF;
  ELSE
    target_id := p_contest_id;
  END IF;
  SELECT * INTO current_board FROM public.contests WHERE id = target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'family_access_denied'; END IF;
  IF p_action NOT IN ('read','edit') AND (p_owner_id IS NULL OR p_owner_id <> current_board.owner_id) THEN
    RAISE EXCEPTION 'family_access_denied';
  END IF;
  IF current_board.published_at IS NOT NULL OR current_board.axis_locked_at IS NOT NULL
    OR current_board.status NOT IN ('draft','reconciling','ready')
    OR current_board.board_data->'isDynamic' = 'true'::jsonb THEN RAISE EXCEPTION 'family_board_locked'; END IF;
  IF p_action IN ('read','edit') THEN
    SELECT * INTO access_row FROM public.family_board_access WHERE token_hash = p_token_hash AND contest_id = target_id FOR UPDATE;
    IF NOT FOUND OR access_row.revoked_at IS NOT NULL OR access_row.expires_at <= clock_timestamp()
      OR EXISTS (SELECT 1 FROM unnest(access_row.cells) idx
        WHERE current_board.board_data->'allocationLabels'->>idx IS DISTINCT FROM access_row.label) THEN
      RAISE EXCEPTION 'family_access_denied';
    END IF;
  END IF;
  IF p_action <> 'read' AND (p_expected_revision IS NULL OR p_expected_revision <> current_board.revision) THEN
    RAISE EXCEPTION 'revision_conflict';
  END IF;
  IF p_action IN ('invite','revoke','reassign') THEN
    label_value := btrim(p_label);
    IF label_value IS NULL OR char_length(label_value) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
  END IF;
  IF p_action IN ('invite','reassign') THEN
    IF p_cells IS NULL OR cardinality(p_cells) NOT BETWEEN 1 AND 100
      OR EXISTS (SELECT 1 FROM unnest(p_cells) idx WHERE idx IS NULL OR idx NOT BETWEEN 0 AND 99)
      OR (SELECT count(DISTINCT idx) FROM unnest(p_cells) idx) <> cardinality(p_cells) THEN
      RAISE EXCEPTION 'family_invalid_request';
    END IF;
    PERFORM public.gridone_validate_sales_board(current_board.board_data);
  END IF;
  IF p_action = 'invite' THEN
    IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
    IF EXISTS (SELECT 1 FROM unnest(p_cells) idx WHERE current_board.board_data->'allocationLabels'->>idx IS DISTINCT FROM label_value) THEN
      RAISE EXCEPTION 'family_access_denied';
    END IF;
    UPDATE public.family_board_access SET revoked_at=clock_timestamp() WHERE contest_id=target_id AND label=label_value AND revoked_at IS NULL;
    INSERT INTO public.family_board_access(contest_id,label,token_hash,cells,expires_at)
      VALUES(target_id,label_value,p_token_hash,p_cells,clock_timestamp()+interval '7 days') RETURNING * INTO access_row;
  ELSIF p_action = 'revoke' THEN
    UPDATE public.family_board_access SET revoked_at=clock_timestamp() WHERE contest_id=target_id AND label=label_value AND revoked_at IS NULL;
  ELSIF p_action = 'reassign' THEN
    IF p_changes IS DISTINCT FROM '{"reviewPaymentNotes":true}'::jsonb THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
    next_board := current_board.board_data;
    IF NOT (next_board ? 'allocationLabels') THEN
      next_board := jsonb_set(next_board,'{allocationLabels}',(SELECT jsonb_agg(NULL::text) FROM generate_series(1,100)));
    END IF;
    FOREACH cell IN ARRAY p_cells LOOP
      next_board := jsonb_set(next_board,ARRAY['allocationLabels',cell::text],to_jsonb(label_value));
    END LOOP;
    SELECT coalesce(jsonb_agg(to_jsonb(entry)),'[]'::jsonb) INTO archived_notes
      FROM (SELECT * FROM public.contest_entries WHERE contest_id=target_id AND cell_index = ANY(p_cells) FOR UPDATE) entry;
    UPDATE public.contest_entries SET paid_status='unknown', seller_label=NULL WHERE contest_id=target_id AND cell_index = ANY(p_cells);
    UPDATE public.family_board_access SET revoked_at=clock_timestamp() WHERE contest_id=target_id AND revoked_at IS NULL AND cells && p_cells;
    UPDATE public.contests SET board_data=next_board WHERE id=target_id RETURNING revision INTO next_revision;
  ELSIF p_action = 'edit' THEN
    IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
    IF jsonb_array_length(p_changes) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
    next_board := current_board.board_data;
    FOR change IN SELECT value FROM jsonb_array_elements(p_changes) LOOP
      IF jsonb_typeof(change) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
      IF EXISTS (SELECT 1 FROM jsonb_object_keys(change) k WHERE k NOT IN ('index','name','availability'))
        OR jsonb_typeof(change->'index') IS DISTINCT FROM 'number' OR (change->>'index') !~ '^[0-9]{1,2}$'
        OR jsonb_typeof(change->'name') IS DISTINCT FROM 'string'
        OR char_length(btrim(change->>'name')) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
      cell := (change->>'index')::integer;
      IF NOT cell = ANY(access_row.cells) THEN RAISE EXCEPTION 'family_access_denied'; END IF;
      IF cell = ANY(changes_seen) THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
      changes_seen := array_append(changes_seen,cell);
      next_board := jsonb_set(next_board,ARRAY['squares',cell::text],jsonb_build_array(btrim(change->>'name')));
      IF change ? 'availability' THEN
        IF change->'availability' NOT IN ('"unspecified"'::jsonb,'"available"'::jsonb,'"unavailable"'::jsonb) THEN RAISE EXCEPTION 'family_invalid_request'; END IF;
        IF NOT (next_board ? 'availability') THEN next_board := jsonb_set(next_board,'{availability}',(SELECT jsonb_agg('unspecified'::text) FROM generate_series(1,100))); END IF;
        next_board := jsonb_set(next_board,ARRAY['availability',cell::text],change->'availability');
      END IF;
    END LOOP;
    UPDATE public.contests SET board_data=next_board WHERE id=target_id RETURNING revision INTO next_revision;
  END IF;
  IF p_action IN ('invite','revoke') THEN
    UPDATE public.contests SET updated_at=clock_timestamp() WHERE id=target_id RETURNING revision INTO next_revision;
  END IF;
  IF p_action <> 'read' THEN
    INSERT INTO public.contest_audit_events(contest_id,actor_id,event_type,previous_revision,next_revision,details)
    VALUES(target_id,CASE WHEN p_action='edit' THEN NULL ELSE p_owner_id END,
      CASE WHEN p_action='reassign' THEN 'family_reassigned' ELSE 'family_'||p_action END,
      current_board.revision,next_revision,
      CASE WHEN p_action='reassign' THEN jsonb_build_object('label',label_value,'cells',p_cells,'paymentNotes',archived_notes)
        WHEN p_action='edit' THEN jsonb_build_object('accessId',access_row.id,'changes',p_changes)
        ELSE jsonb_build_object('label',label_value) END);
  END IF;
  IF p_action='invite' THEN RETURN jsonb_build_object('label',label_value,'cells',p_cells,'expiresAt',access_row.expires_at,'revision',next_revision); END IF;
  IF p_action IN ('revoke','reassign') THEN RETURN jsonb_build_object('revision',next_revision); END IF;
  RETURN jsonb_build_object('title',current_board.title,'label',access_row.label,'revision',coalesce(next_revision,current_board.revision),'cells',
    (SELECT jsonb_agg(jsonb_build_object('index',idx,'name',coalesce(coalesce(next_board,current_board.board_data)->'squares'->idx->>0,''),
      'availability',coalesce(coalesce(next_board,current_board.board_data)->'availability'->>idx,'unspecified')) ORDER BY idx) FROM unnest(access_row.cells) idx));
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_family_access(text,uuid,uuid,bigint,text,text,integer[],jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gridone_family_access(text,uuid,uuid,bigint,text,text,integer[],jsonb) TO service_role;

-- Finalized snapshots retain only explicitly published participation fields.
CREATE FUNCTION public.gridone_project_public_participation()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE source_details jsonb; safe_details jsonb;
BEGIN
  SELECT board_data->'participation' INTO source_details FROM public.contests WHERE id=NEW.contest_id;
  IF jsonb_typeof(source_details) = 'object' THEN
    SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO safe_details
      FROM jsonb_each(source_details) WHERE key IN ('purpose','instructions','squarePrice') AND jsonb_typeof(value)='string';
    NEW.board := (NEW.board - 'participation') || jsonb_build_object('participation',safe_details);
  ELSE
    NEW.board := NEW.board - 'participation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.gridone_project_public_participation() FROM PUBLIC;
CREATE TRIGGER gridone_project_public_participation BEFORE INSERT OR UPDATE OF board ON public.public_board_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.gridone_project_public_participation();
