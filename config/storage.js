const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Helper: Ambil seluruh data dari key hotspot_users_data
async function getMasterData() {
  try {
    const data = await redis.get('hotspot_users_data');
    if (!data) return { users: [] };
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('Gagal mengambil data dari Redis:', err);
    return { users: [] };
  }
}

// Helper: Simpan seluruh data ke key hotspot_users_data
async function saveMasterData(data) {
  try {
    await redis.set('hotspot_users_data', JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Gagal menyimpan data ke Redis:', err);
    return false;
  }
}

// 1. Menambahkan user baru
async function addUser(userData) {
  try {
    const master = await getMasterData();
    const newUser = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      password: userData.password,
      status: 'pending',
      approvedAt: '',
      approvedBy: ''
    };

    master.users.push(newUser);
    await saveMasterData(master);
    return true;
  } catch (err) {
    console.error('Gagal menambah user:', err);
    return false;
  }
}

// 2. Mengambil user berdasarkan username
async function getUserByUsername(username) {
  try {
    const master = await getMasterData();
    return master.users.find(u => u.username === username) || null;
  } catch (err) {
    console.error('Gagal mencari user:', err);
    return null;
  }
}

// 3. Mengambil semua user untuk Admin Panel
async function getAllUsers() {
  try {
    const master = await getMasterData();
    return master.users || [];
  } catch (err) {
    console.error('Gagal mengambil semua user:', err);
    return [];
  }
}

// 4. Approve user
async function approveUser(username, adminName) {
  try {
    const master = await getMasterData();
    const user = master.users.find(u => u.username === username);
    if (!user) return false;

    user.status = 'approved';
    user.approvedBy = adminName;
    user.approvedAt = new Date().toISOString();

    await saveMasterData(master);
    return true;
  } catch (err) {
    console.error('Gagal approve user:', err);
    return false;
  }
}

// 5. Reject user
async function rejectUser(username, adminName) {
  try {
    const master = await getMasterData();
    const user = master.users.find(u => u.username === username);
    if (!user) return false;

    user.status = 'rejected';
    user.rejectedBy = adminName;
    user.rejectedAt = new Date().toISOString();

    await saveMasterData(master);
    return true;
  } catch (err) {
    console.error('Gagal reject user:', err);
    return false;
  }
}

// 6. Delete user
async function deleteUser(username) {
  try {
    const master = await getMasterData();
    master.users = master.users.filter(u => u.username !== username);
    await saveMasterData(master);
    return true;
  } catch (err) {
    console.error('Gagal menghapus user:', err);
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
  savePendingUser: addUser,
  getPendingUser: getUserByUsername,
  removePendingUser: deleteUser
};
