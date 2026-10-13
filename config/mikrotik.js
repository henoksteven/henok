const { RouterOSAPI } = require('node-routeros');

// Helper koneksi ke MikroTik
function createConnection() {
  return new RouterOSAPI({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    port: parseInt(process.env.MIKROTIK_PORT) || 8728,
    timeout: 10000
  });
}

// Tambah user ke Hotspot MikroTik saat di-approve
async function addUserToHotspot(username, password, profile = 'default') {
  const conn = createConnection();
  try {
    await conn.connect();
    const result = await conn.write('/ip/hotspot/user/add', [
      `name=${username}`,
      `password=${password}`,
      `profile=${profile}`
    ]);
    await conn.disconnect();
    return { success: true, data: result };
  } catch (err) {
    console.error('Gagal menambah user ke Hotspot MikroTik:', err);
    try { await conn.disconnect(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

// Hapus user dari Hotspot MikroTik
async function removeUserFromHotspot(username) {
  const conn = createConnection();
  try {
    await conn.connect();
    // Cari ID user berdasarkan nama
    const users = await conn.write('/ip/hotspot/user/print', [`?.id=${username}`]);
    // Jika print pakai query tidak langsung ketemu, kita ambil semua lalu cari
    const allUsers = await conn.write('/ip/hotspot/user/print');
    const targetUser = allUsers.find(u => u.name === username);

    if (targetUser) {
      await conn.write('/ip/hotspot/user/remove', [`=.id=${targetUser['.id']}`]);
    }

    await conn.disconnect();
    return { success: true };
  } catch (err) {
    console.error('Gagal menghapus user dari Hotspot MikroTik:', err);
    try { await conn.disconnect(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

// Validasi login user hotspot
async function validateLogin(username, password) {
  const conn = createConnection();
  try {
    await conn.connect();
    const allUsers = await conn.write('/ip/hotspot/user/print');
    await conn.disconnect();

    const target = allUsers.find(u => u.name === username && u.password === password);
    if (target) {
      return { success: true, message: 'Login valid di MikroTik' };
    } else {
      return { success: false, message: 'Username atau password salah di MikroTik' };
    }
  } catch (err) {
    console.error('Gagal validasi login ke MikroTik:', err);
    try { await conn.disconnect(); } catch (e) {}
    return { success: false, error: err.message };
  }
}

// Ambil statistik bytes dan uptime user
async function getUsersStats() {
  const conn = createConnection();
  try {
    await conn.connect();
    // Ambil data dari active hotspot users
    const activeUsers = await conn.write('/ip/hotspot/active/print');
    await conn.disconnect();
    return activeUsers;
  } catch (err) {
    console.error('Gagal mengambil statistik MikroTik:', err);
    try { await conn.disconnect(); } catch (e) {}
    return [];
  }
}

module.exports = {
  addUserToHotspot,
  removeUserFromHotspot,
  validateLogin,
  getUsersStats
};
