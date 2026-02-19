const path = require('path');
const { readFile } = require('fs/promises');

const clothesPath = path.join(__dirname, '..', 'data', 'clothes.json');

const readClothes = async () => {
	const file = await readFile(clothesPath, 'utf-8');
	return JSON.parse(file);
};

exports.listClothes = async (req, res, next) => {
	try {
		const { gender = 'all', category } = req.query;
		const items = await readClothes();
		const filtered = items.filter((item) => {
			const matchesGender =
				gender === 'all' || item.gender === gender || item.gender === 'unisex';
			const matchesCategory = category ? item.category === category : true;
			return matchesGender && matchesCategory;
		});
		res.json({ items: filtered });
	} catch (error) {
		next(error);
	}
};

exports.getClothingById = async (req, res, next) => {
	try {
		const items = await readClothes();
		const item = items.find((entry) => entry.id === req.params.id);
		if (!item) {
			res.status(404).json({ message: 'Item not found' });
			return;
		}
		res.json(item);
	} catch (error) {
		next(error);
	}
};
