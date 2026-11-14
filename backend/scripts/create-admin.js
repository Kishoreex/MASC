const bcrypt = require('bcryptjs');
const { db, sql } = require('../db');
const username = process.argv[2];
const password = process.argv[3];
if (!username || !password || password.length < 12 || username.length > 120) {
  console.error('Usage: npm run create-admin -- staff@example.com "StrongPasswordAtLeast12Chars"');
  process.exit(1);
}
(async () => {
  const hash = await bcrypt.hash(password, 12);
  const result = await (await db()).request()
    .input('username', sql.NVarChar(120), username.toLowerCase())
    .input('hash', sql.NVarChar(255), hash)
    .query('INSERT INTO dbo.AdminUsers (Username,PasswordHash) VALUES (@username,@hash)');
  console.log('Admin account created:', username);
  process.exit(0);
})().catch(e => {console.error(e.message); process.exit(1);});
