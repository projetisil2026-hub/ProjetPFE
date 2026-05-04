const prisma = require('../config/prisma');

const parseReadBy = (v) => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

const formatNotif = (n) => ({ ...n, readBy: parseReadBy(n.readBy) });

exports.getAll = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { timestamp: 'desc' },
    });
    res.json({ success: true, data: notifications.map(formatNotif) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { message, senderName } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message required.' });

    const notif = await prisma.notification.create({
      data: {
        message,
        senderId: req.user.userId,
        senderName: senderName || 'Admin',
        readBy: '[]',
      },
    });

    const io = req.app.get('io');
    if (io) io.emit('new_notification', formatNotif(notif));

    res.status(201).json({ success: true, data: formatNotif(notif) });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Not found.' });

    const readBy = parseReadBy(notif.readBy);
    if (!readBy.includes(userId)) {
      await prisma.notification.update({
        where: { id },
        data: { readBy: JSON.stringify([...readBy, userId]) },
      });
    }
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const all = await prisma.notification.findMany();

    await Promise.all(
      all.map(async (n) => {
        const readBy = parseReadBy(n.readBy);
        if (!readBy.includes(userId)) {
          await prisma.notification.update({
            where: { id: n.id },
            data: { readBy: JSON.stringify([...readBy, userId]) },
          });
        }
      })
    );

    res.json({ success: true, message: 'All marked as read.' });
  } catch (err) {
    next(err);
  }
};
