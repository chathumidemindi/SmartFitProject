const path = require('path');
const { readFile } = require('fs/promises');

const avatarsPath = path.join(__dirname, '..', 'data', 'avatars.json');

const readAvatars = async () => {
	const file = await readFile(avatarsPath, 'utf-8');
	return JSON.parse(file);
};

exports.listAvatars = async (req, res, next) => {
	try {
		const { skinTone, bodyType } = req.query;
		const avatars = await readAvatars();
		const filtered = avatars.filter((avatar) => {
			const matchesSkinTone = skinTone ? avatar.skinTone === skinTone : true;
			const matchesBodyType = bodyType ? avatar.bodyType === bodyType : true;
			return matchesSkinTone && matchesBodyType;
		});
		res.json({ avatars: filtered });
	} catch (error) {
		next(error);
	}
};

exports.getAvatarById = async (req, res, next) => {
	try {
		const avatars = await readAvatars();
		const avatar = avatars.find((entry) => entry.id === req.params.id);
		if (!avatar) {
			res.status(404).json({ message: 'Avatar not found' });
			return;
		}
		res.json(avatar);
	} catch (error) {
		next(error);
	}
};
