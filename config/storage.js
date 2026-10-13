const { Redis } = require('@upstash/redis');

// Inisialisasi Redis dari Vercel Environment Variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 1. Menambahkan user baru (status pending) saat register
async function addUser(userData) {
  try {
    const dataToSave = {
      ...userData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await redis.set(`user:${userData.username}`, JSON.stringify(dataToSave));
    
    // Simpan juga ke list set untuk melacak semua username yang terdaftar
    await redis.sadd('all_usernames', userData.username);
    return true;
  } catch (err) {
    console.error('Gagal menambahkan user ke Redis:', err);
    return false;
  }
}

// 2. Mengambil data user berdasarkan username
async function getUserByUsername(username) {
  try {
    const data = await redis.get(`user:${username}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('Gagal mengambil user dari Redis:', err);
    return null;
  }
}

// 3. Mengambil semua daftar user untuk halaman admin
async function getAllUsers() {
  try {
    const usernames = await redis.smembers('all_usernames');
    if (!usernames || usernames.length === 0) return [];

    const users = [];
    for (const username of usernames) {
      const user = await getUserByUsername(username);
      if (user) users.push(user);
    }
    return users;
  } catch (err) {
    console.error('Gagal mengambil semua user dari Redis:', err);
    return [];
  }
}

// 4. Approve user
async function approveUser(username, adminName) {
  try {
    const user = await getUserByUsername(username);
    if (!user) return false;

    user.status = 'approved';
    user.approvedBy = adminName;
    user.approvedAt = new Date().toISOString();

    await redis.set(`user:${username}`, JSON.stringify(user));
    return true;
  } catch (err) {
    console.error('Gagal approve user:', err);
    return false;
  }
}

// 5. Reject user
async function rejectUser(username, adminName) {
  try {
    const user = await getUserByUsername(username);
    if (!user) return false;

    user.status = 'rejected';
    user.rejectedBy = adminName;
    user.rejectedAt = new Date().toISOString();

    await redis.set(`user:${username}`, JSON.stringify(user));
    return true;
  } catch (err) {
    console.error('Gagal reject user:', err);
    return false;
  }
}

// 6. Delete user
async function deleteUser(username) {
  try {
    await redis.del(`user:${username}`);
    await redis.srem('all_usernames', username);
    return true;
  } catch (err) {
    console.error('Gagal menghapus user dari Redis:', err);
    return false;
  }
}

module.exports = {
  addUser,
  getUserByUsername,
  getAllUsers,
  approveUser,
  rejectUser,
  deleteUser,
  // Alias tambahan untuk kompatibilitas fungsi lama
  savePendingUser: addUser,
  getPendingUser: getUserByUsername,
  removePendingUser: deleteUser
};
