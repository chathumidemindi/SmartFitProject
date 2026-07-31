const path = require('path');
const { readFile } = require('fs/promises');
const User = require('../models/User');
const { calculateBodyType } = require('../services/bodyTypeService');
const { isValidSkinTone } = require('../services/skinToneService');

const avatarsPath = path.join(__dirname, '..', 'data', 'avatars.json');

// GET /api/users — list all registered users for admin (exclude passwords)
exports.listAllUsers = async (req, res, next) => {
	try {
		const users = await User.find().select('-password').sort({ createdAt: -1 });
		res.json({ success: true, users });
	} catch (error) {
		next(error);
	}
};

const readAvatars = async () => {
	const file = await readFile(avatarsPath, 'utf-8');
	return JSON.parse(file);
};

// Existing avatar listing handlers
exports.listAvatars = async (req, res, next) => {
	try {
		const { skinTone, bodyType } = req.query;
		const avatars = await readAvatars();
		const filtered = avatars.filter((avatar) => {
			const matchesSkinTone = skinTone ? avatar.skinTone === skinTone : true;
			const matchesBodyType = bodyType ? avatar.bodyType === bodyType : true;
			return matchesSkinTone && matchesBodyType;
		});
		res.json({ success: true, message: 'Avatars fetched successfully', data: { avatars: filtered } });
	} catch (error) {
		next(error);
	}
};

exports.getAvatarById = async (req, res, next) => {
	try {
		const avatars = await readAvatars();
		const avatar = avatars.find((entry) => entry.id === req.params.id);
		if (!avatar) {
			res.status(404).json({ success: false, message: 'Avatar not found', data: null });
			return;
		}
		res.json({ success: true, message: 'Avatar fetched successfully', data: avatar });
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/users/profile
 * Save or update user profile with body measurements, calculated body type, and skin tone
 */
exports.saveProfile = async (req, res, next) => {
	try {
		const {
			name = 'SmartFit User',
			email,
			password = 'defaultPassword123',
			bodyProfile,
			manualBodyType
		} = req.body;

		if (!email) {
			res.status(400).json({ success: false, message: 'User email is required.', data: null });
			return;
		}

		let finalBodyProfile = bodyProfile || {};
		let measurements = finalBodyProfile.measurements || req.body.measurements || {};
		let skinTone = finalBodyProfile.skinTone || req.body.skinTone || 'medium';
		let genderPreference = finalBodyProfile.genderPreference || req.body.genderPreference || req.body.gender || 'unisex';

		if (skinTone && !isValidSkinTone(skinTone)) {
			res.status(400).json({
				success: false,
				message: `Invalid skin tone '${skinTone}'. Allowed values: fair, light, medium, tan, deep, dark.`,
				data: null
			});
			return;
		}

		let bodyType = finalBodyProfile.bodyType || manualBodyType;
		let confidence = finalBodyProfile.confidence || 100;

		const upperMeasurement = measurements.chest || measurements.bust || measurements.shoulderWidth || measurements.shoulder;

		// Calculate body type automatically if measurements exist and body type isn't specified
		if ((!bodyType || manualBodyType) && upperMeasurement && measurements.waist && measurements.hip) {
			const calculated = calculateBodyType({
				measurements,
				manualBodyType,
				gender: genderPreference,
				genderPreference
			});
			bodyType = calculated.bodyType;
			confidence = calculated.confidence;
		}

		if (!bodyType) {
			res.status(400).json({
				success: false,
				message: 'Please provide either body measurements or select a body type.',
				data: null
			});
			return;
		}

		const updatedProfileData = {
			name,
			email: email.toLowerCase().trim(),
			password,
			bodyProfile: {
				genderPreference,
				measurements,
				bodyType,
				confidence,
				skinTone
			}
		};

		const user = await User.findOneAndUpdate(
			{ email: email.toLowerCase().trim() },
			updatedProfileData,
			{ new: true, upsert: true, runValidators: true }
		);

		res.json({
			success: true,
			message: 'User body profile saved successfully.',
			data: { user }
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /api/users/profile/:id
 * Retrieve saved user profile by ID or Email
 */
exports.getProfileById = async (req, res, next) => {
	try {
		const { id } = req.params;
		let user = null;

		if (id.match(/^[0-9a-fA-F]{24}$/)) {
			user = await User.findById(id);
		} else {
			user = await User.findOne({ email: id.toLowerCase().trim() });
		}

		if (!user) {
			res.status(404).json({ success: false, message: 'User profile not found', data: null });
			return;
		}

		res.json({
			success: true,
			message: 'User profile fetched successfully',
			data: { user }
		});
	} catch (error) {
		next(error);
	}
};
