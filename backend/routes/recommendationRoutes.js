const { Router } = require('express');
const { getRecommendations } = require('../controllers/recommendationController');

const router = Router();

router.post('/', getRecommendations);
router.post('/:userId', getRecommendations);

module.exports = router;
