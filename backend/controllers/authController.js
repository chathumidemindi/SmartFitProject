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
