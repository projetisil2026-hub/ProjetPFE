const prisma = require('../config/prisma');

exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ fromId: userId }, { toId: userId }],
      },
      orderBy: { timestamp: 'asc' },
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' },
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.send = async (req, res, next) => {
  try {
    const { toId, message, type = 'private' } = req.body;
    const fromId = req.user.userId;

    if (!toId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'toId and message required.' });
    }

    const chatId = type === 'group'
      ? `group_${toId}`
      : [fromId, toId].sort().join('_');

    const msg = await prisma.message.create({
      data: { fromId, toId, message: message.trim(), type, chatId },
    });

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${toId}`).emit('new_message', msg);
    }

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};
