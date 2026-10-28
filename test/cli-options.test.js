import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from '../src/cli-options.js';
test('invalid CLI invocations fail before client setup',()=>{
 for(const args of [['goal','x','--typo','y'],['config','typo'],['roster','typo','developer'],['message'],['interrupt','--goal','x'],['goal','--prompt'],['roster','add'],['status','surprise'],['goal','a','--prompt','b'],['goal','x','--disabled']])assert.throws(()=>parseArgs(args),undefined,args.join(' '));
});
test('help and literal prompts cannot fall through to mutation',()=>{
 assert.equal(parseArgs(['goal','x','--help']).help,true);
 assert.equal(parseArgs(['roster','remove','--help']).help,true);
 assert.deepEqual(parseArgs(['goal','--','--help']).words,['goal','--help']);
 assert.equal(parseArgs(['message','developer','--body','hello']).flags.body,'hello');
});
