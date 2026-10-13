import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export function createDatabase(filename=':memory:'){
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
 const schema=readFileSync(new URL('./0000_argus_demo.sql',import.meta.url),'utf8');
 const exists=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='demo_sessions'").get();if(!exists)sqlite.exec(schema);
 const adapt=(query,args=[])=>({bind(...values){return adapt(query,values);},async first(){return sqlite.prepare(query).get(...args)||null;},async all(){return {results:sqlite.prepare(query).all(...args)};},async run(){const info=sqlite.prepare(query).run(...args);return {meta:{changes:Number(info.changes)}};},_query:query,_args:args});
 return {prepare:query=>adapt(query),async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=[];for(const st of statements){const info=sqlite.prepare(st._query).run(...st._args);results.push({meta:{changes:Number(info.changes)}});}sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close(){sqlite.close();}};
}
