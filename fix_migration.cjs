const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');
try { db.exec("ALTER TABLE booklists ADD COLUMN content TEXT"); console.log('Added content'); } catch(e) { console.log('content:', e.message); }
try { db.exec("ALTER TABLE reading_paths ADD COLUMN guideType TEXT"); console.log('Added guideType'); } catch(e) { console.log('guideType:', e.message); }
try { db.exec("ALTER TABLE reading_path_nodes ADD COLUMN introduction TEXT"); console.log('Added introduction'); } catch(e) { console.log('introduction:', e.message); }
db.close();
