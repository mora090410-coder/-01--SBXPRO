import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const {query}=vi.hoisted(()=>({query:vi.fn()}));
vi.mock('../services/supabase',()=>({supabase:{from:()=>({select:()=>({eq:query})})}}));
import {useContestEntries} from '../hooks/useContestEntries';
beforeEach(()=>{query.mockReset();});
it('refreshes private notes after responsibility changes instead of retaining old paid state',async()=>{
 query.mockResolvedValueOnce({data:[{cell_index:12,paid_status:'paid',seller_label:'Old family'}],error:null});
 const {result}=renderHook(()=>useContestEntries('board'));
 await waitFor(()=>expect(result.current.entryMetaByIndex[12]?.paid_status).toBe('paid'));
 query.mockResolvedValueOnce({data:[{cell_index:12,paid_status:'unknown',seller_label:null}],error:null});
 await act(()=>result.current.reloadEntries());
 expect(result.current.entryMetaByIndex[12].paid_status).toBe('unknown');
 expect(result.current.entryMetaByIndex[12].seller_label).toBeNull();
});
it('keeps a newly opened board unready until its private notes load',async()=>{
 let resolve!: (value:unknown)=>void;
 query.mockReturnValue(new Promise(done=>{resolve=done;}));
 const {result}=renderHook(()=>useContestEntries('board'));
 expect(result.current.hasLoadedEntries).toBe(false);
 await act(async()=>resolve({data:[],error:null}));
 expect(result.current.hasLoadedEntries).toBe(true);
});
