import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
const executable=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
test('Chromium dashboard keeps drafts, retries once, and presents accessible approval controls',{skip:!existsSync(executable)},async()=>{
 const browser=await chromium.launch({executablePath:executable,headless:true,args:['--no-sandbox']});
 try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state={project:{name:'Browser fixture'},config:{defaultModel:'model',limits:{},agents:[{id:'a',name:'Agent',enabled:true,permission:'read-only'}],specifications:[]},configRevision:'initial',goals:[],tasks:[],participants:[],turns:[],messages:[],notes:[],events:[],evidence:[],approvals:[{id:'approval',agent_id:'a',method:'item/tool/requestUserInput',params_json:JSON.stringify({questions:[{id:'q',question:'Your response',isSecret:true}]})}]};
 const submissions=[];
 await page.route('http://127.0.0.1:47831/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/'){return route.fulfill({contentType:'text/html',body:readFileSync(new URL('../public/index.html',import.meta.url),'utf8')});}if(['/app.js','/style.css'].includes(url.pathname))return route.fulfill({contentType:url.pathname.endsWith('.js')?'text/javascript':'text/css',body:readFileSync(new URL('../public'+url.pathname,import.meta.url),'utf8')});if(url.pathname==='/api/projects')return route.fulfill({json:[{id:'p',root:'/project'}]});if(url.pathname.startsWith('/api/read/'))return route.fulfill({json:{items:[],nextCursor:null}});if(route.request().method()==='POST'){submissions.push(route.request().postDataJSON());await new Promise(r=>setTimeout(r,250));return route.fulfill({json:{id:'goal'}});}return route.fulfill({json:state});});
 await page.goto('http://127.0.0.1:47831/#fake-token');await page.getByLabel('Your response').fill('private draft');assert.equal(await page.getByLabel('Your response').getAttribute('type'),'password');await page.getByRole('heading',{name:'Human approvals'}).click();await page.waitForTimeout(5300);assert.equal(await page.getByLabel('Your response').inputValue(),'private draft');await page.locator('#goal-prompt').fill('Build fixture');await page.locator('#goal-form').evaluate(form=>{form.dispatchEvent(new Event('submit',{cancelable:true}));form.dispatchEvent(new Event('submit',{cancelable:true}));});await page.waitForTimeout(600);assert.equal(submissions.length,1);assert.equal(await page.locator('#goal-prompt').inputValue(),'');assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
