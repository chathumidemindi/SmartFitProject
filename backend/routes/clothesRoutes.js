const { Router } = require('express');
const {
  listClothes,
  getClothingById,
  createClothing,
  updateClothing,
  deleteClothing,
  tryOnGarment
} = require('../controllers/clothesController');

const router = Router();

router.get('/', listClothes);
router.get('/:id', getClothingById);
router.post('/', createClothing);
router.put('/:id', updateClothing);
router.delete('/:id', deleteClothing);
router.post('/:id/try-on', tryOnGarment);

module.exports = router;
