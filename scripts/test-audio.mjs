import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const manifestUrl = new URL('../public/audio/manifest.json', import.meta.url);
const manifest = JSON.parse(readFileSync(fileURLToPath(manifestUrl), 'utf8'));

function testPlayAudioByKeys(keys) {
  let index = 0;
  const playNext = () => {
    if (index >= keys.length) return;
    const entry = manifest[keys[index]];
    if (!entry) { 
      console.log('  Key not found:', keys[index], '- skipping');
      index++; 
      playNext(); 
      return; 
    }
    console.log('  Would play:', keys[index]);
    index++;
    playNext();
  };
  playNext();
}

console.log('Test: Missing key in middle');
testPlayAudioByKeys(['morning.shared.get-ready', 'MISSING.KEY', 'morning.shared.step.0']);
