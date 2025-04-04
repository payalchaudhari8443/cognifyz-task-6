const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3005; // Using 3005 to avoid conflicts

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/task6', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Item Schema
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Item = mongoose.model('Item', itemSchema);

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // Replace with a secure key in production

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// API Endpoints (Protected)
app.get('/api/items', authenticateToken, async (req, res) => {
    const items = await Item.find({ userId: req.user.id });
    res.json(items);
});

app.post('/api/items', authenticateToken, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const item = new Item({ name, userId: req.user.id });
    await item.save();
    res.status(201).json(item);
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    const item = await Item.findOne({ _id: id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!name) return res.status(400).json({ error: 'Name is required' });

    item.name = name;
    await item.save();
    res.json(item);
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const result = await Item.deleteOne({ _id: id, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});