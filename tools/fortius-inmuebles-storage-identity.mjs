/** Rename empty Storage containers through the API; refuse any data-bearing source. */
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'qkkirjzhviqwvuqjnmei.supabase.co');
const client=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const mode=process.argv[2];assert.ok(['prepare','retire'].includes(mode));
const listed=await client.storage.listBuckets();if(listed.error)throw listed.error;
const buckets=listed.data;
for(const source of buckets.filter(b=>/^(mnt|cota)-/.test(b.id))){
 const objects=await client.storage.from(source.id).list('',{limit:1});if(objects.error)throw objects.error;
 assert.equal(objects.data.length,0,`Nonempty source refused: ${source.id}`);
}
if(mode==='prepare'){
 for(const source of buckets.filter(b=>b.id.startsWith('mnt-'))){
  const id=source.id.replace('mnt-','fortius-inmuebles-');
  const existing=buckets.find(b=>b.id===id);
  if(existing){assert.equal(existing.public,source.public);assert.equal(existing.file_size_limit,source.file_size_limit);continue;}
  const result=await client.storage.createBucket(id,{public:source.public,fileSizeLimit:source.file_size_limit,allowedMimeTypes:source.allowed_mime_types});if(result.error)throw result.error;
  console.log(JSON.stringify({created:id,public:source.public}));
 }
}else{
 // Each old empty container can be recreated from the saved bucket inventory.
 for(const source of buckets.filter(b=>/^(mnt|cota)-/.test(b.id))){
  const replacement=buckets.find(b=>b.id===source.id.replace(/^(mnt|cota)-/,'fortius-inmuebles-'));
  assert.ok(replacement,`Replacement missing: ${source.id}`);assert.equal(replacement.public,source.public);
  const result=await client.storage.deleteBucket(source.id);if(result.error)throw result.error;
  console.log(JSON.stringify({retiredEmpty:source.id}));
 }
}
const final=await client.storage.listBuckets();if(final.error)throw final.error;
console.log(JSON.stringify({buckets:final.data.map(b=>({id:b.id,public:b.public}))}));
