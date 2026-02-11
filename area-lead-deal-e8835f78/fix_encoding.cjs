
const fs = require('fs');
const path = 'src/integrations/supabase/types.ts';

try {
    const content = fs.readFileSync(path);
    // Check for UTF-16 LE BOM
    if (content[0] === 0xFF && content[1] === 0xFE) {
        console.log('Detected UTF-16 LE BOM. Converting...');
        const text = fs.readFileSync(path, 'utf16le');
        fs.writeFileSync(path, text, 'utf8');
        console.log('Converted to UTF-8');
    } else {
        console.log('No UTF-16 LE BOM detected. Assuming UTF-8 or compatible.');
        // Optional: rewritten to ensure clear UTF-8
        const text = fs.readFileSync(path, 'utf8');
        fs.writeFileSync(path, text, 'utf8');
    }
} catch (e) {
    console.error(e);
}
