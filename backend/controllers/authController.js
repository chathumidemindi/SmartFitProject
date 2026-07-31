exports.login = (req, res) => {
	const { name, email } = req.body;
	if (!name || !email) {
		res.status(400).json({ message: 'Name and email are required.' });
		return;
	}
	res.json({
		user: { name, email },
		message: 'Mock login successful.',
	});
};

const User = require('../models/User');

exports.register = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
		}
		
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({ success: false, message: 'Email already exists.' });
		}

		const user = await User.create({
			name,
			email: email.toLowerCase(),
			password, // In a real app, hash this
		});

		res.json({
			success: true,
			user: { name: user.name, email: user.email },
			message: 'Registration successful.'
		});
	} catch (error) {
		next(error);
	}
};
