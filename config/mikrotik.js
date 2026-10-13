const { RouterOSAPI } = require('node-routeros');

async function addHotspotUser(username, password, profile = 'default') {
  const conn = new RouterOSAPI({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    port: parseInt(process.env.MIKROTIK_PORT) || 8728,
    timeout: 10000
  });

  try {
    await conn.connect();
    
    // Perintah untuk menambahkan user hotspot ke MikroTik
    const result = await conn.write('/ip/hotspot/user/add', [
      `name=${username}`,
      `password=${password}`,
      `profile=${profile}`
    ]);

    await conn.disconnect();
    return { success: true, data: result };
  } catch (err) {
    console.error('Gagal terhubung atau menambahkan user ke MikroTik:', err);
    try { await conn.disconnect(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

module.exports = { addHotspotUser };
