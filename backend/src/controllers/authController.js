const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const formatUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
    }

    const id = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: id },
          { username: id },
        ],
      },
    });

    if (!user) return res.status(401).json({ success: false, message: 'user_not_found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'invalid_password' });

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: 'role_mismatch' });
    }

    // Build childrenIds for parents
    let safeUser = formatUser(user);
    if (user.role === 'parent') {
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      safeUser.childrenIds = children.map(c => c.id);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ success: true, data: { token, user: safeUser } });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out.' });
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let safeUser = formatUser(user);
    if (user.role === 'parent') {
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      safeUser.childrenIds = children.map(c => c.id);
    }

    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
};
