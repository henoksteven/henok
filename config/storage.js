const { Redis } = require('@upstash/redis');

// Menginisialisasi koneksi Redis menggunakan env vars dari Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Menyimpan data user pending
async function savePendingUser(username, userData) {
  try {
    await redis.set(`pending_user:${username}`, JSON.stringify(userData));
    return true;
  } catch (err) {
    console.error('Gagal menyimpan ke Redis:', err);
    return false;
  }
}

// Mengambil data user pending
async function getPendingUser(username) {
  try {
    const data = await redis.get(`pending_user:${username}`);
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('Gagal mengambil dari Redis:', err);
    return null;
  }
}

// Menghapus data user pending setelah di-approve
async function removePendingUser(username) {
  try {
    await redis.del(`pending_user:${username}`);
    return true;
  } catch (err) {
    console.error('Gagal menghapus dari Redis:', err);
    return false;
  }
}

module.exports = {
  savePendingUser,
  getPendingUser,
  removePendingUser,
};
