const { Router } = require('express');
const { login, register } = require('../controllers/authController');
const { listAllUsers, listAvatars, getAvatarById, saveProfile, getProfileById } = require('../controllers/userController');

const router = Router();

// Admin: list all registered users
router.get('/users', listAllUsers);

// Auth & Legacy Avatars
router.post('/login', login);
router.post('/register', register);
router.get('/avatars', listAvatars);
router.get('/avatars/:id', getAvatarById);

// User Fashion & Body Profile
router.post('/profile', saveProfile);
router.get('/profile/:id', getProfileById);

module.exports = router;
