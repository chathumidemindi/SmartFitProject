const { Router } = require('express');
const { listClothes, getClothingById } = require('../controllers/clothesController');

const router = Router();

router.get('/', listClothes);
router.get('/:id', getClothingById);

module.exports = router;
