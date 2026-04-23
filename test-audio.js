const manifest = require('./public/audio/manifest.json');

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
