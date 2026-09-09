import { describe, it, expect } from 'vitest';
import { validateSalesBoard, projectSalesBoard } from '../functions/_lib/pregameBoard';
const board = () => ({squares:Array.from({length:100},()=>['Mora']),leftAxis:Array(10).fill(null),topAxis:Array(10).fill(null)});
describe('explicit participation data',()=>{
 it('rejects invalid availability independently of names',()=>{
  expect(validateSalesBoard({...board(),availability:['available']})).toBeTruthy();
  expect(validateSalesBoard({...board(),availability:Array(100).fill('sold')})).toBeTruthy();
 });
 it('does not infer availability for existing boards',()=>{
  expect(projectSalesBoard(board()).availability).toEqual(Array(100).fill('unspecified'));
 });
 it('projects only explicit public text and availability',()=>{
  const result=projectSalesBoard({...board(),availability:Array(100).fill('available'),participation:{purpose:'Help our team',squarePrice:'$20',instructions:'Ask the organizer',email:'PRIVATE'},contact:'PRIVATE'});
  expect(result.participation).toEqual({purpose:'Help our team',squarePrice:'$20',instructions:'Ask the organizer'});
  expect(JSON.stringify(result)).not.toContain('PRIVATE');
 });
 it('rejects unknown public keys, malformed and excessive public text',()=>{
  for(const participation of [{email:'private'}, {purpose:'x'.repeat(281)},'bad',{squarePrice:20}]) expect(validateSalesBoard({...board(),participation})).toBeTruthy();
 });
});
