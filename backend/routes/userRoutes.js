const { Router } = require('express');
const { login } = require('../controllers/authController');
const { listAvatars, getAvatarById } = require('../controllers/userController');

const router = Router();

router.post('/login', login);
router.get('/avatars', listAvatars);
router.get('/avatars/:id', getAvatarById);

module.exports = router;
