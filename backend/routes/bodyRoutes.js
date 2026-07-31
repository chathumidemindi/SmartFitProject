const { Router } = require('express');
const { analyzeBody } = require('../controllers/bodyController');

const router = Router();

router.post('/analyze', analyzeBody);

module.exports = router;
