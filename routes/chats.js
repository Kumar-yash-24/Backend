const express = require('express');
const router = express.Router();
const {
	getChats,
	createChat,
	appendMessages,
	updateChat,
	deleteChat,
} = require('../controllers/chatController');
const { authenticateUser } = require('../middleware/auth_middleware');

router.use(authenticateUser);

router.route('/').get(getChats).post(createChat);
router.post('/:chatId/messages', appendMessages);
router.patch('/:chatId', updateChat);
router.delete('/:chatId', deleteChat);

module.exports = router;