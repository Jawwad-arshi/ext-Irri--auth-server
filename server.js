const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-strong-secret';

// Token valid for 3 days (in seconds)
const TOKEN_TTL_SEC = 3 * 24 * 60 * 60; // 3 days

// In-memory allowlist / blacklist for demonstration (use DB in production)
const issuedTokens = new Set();
const revokedTokens = new Set();

// --- ADMIN ENDPOINT: Generate token using one-time password ---
app.post('/api/get-token', (req, res) => {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ ok: false, error: 'Invalid password' });
    }

    const payload = { issuedAt: Date.now() };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });

    issuedTokens.add(token);
    res.json({ ok: true, token, expiresIn: TOKEN_TTL_SEC });
});

// --- VALIDATION ENDPOINT: Used by extension ---
app.post('/api/validate', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ ok: false, error: 'missing token' });
    if (revokedTokens.has(token)) return res.status(403).json({ ok: false, error: 'revoked' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ ok: false, error: 'invalid' });
        return res.json({ ok: true, expiresAt: Date.now() + 1000 * TOKEN_TTL_SEC });
    });
});

// --- ADMIN REVOKE ENDPOINT ---
app.post('/api/revoke', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ ok: false, error: 'missing token' });
    revokedTokens.add(token);
    res.json({ ok: true });
});

// --- SIMPLE VERIFY ENDPOINT FOR EXTENSION STARTUP ---
app.get('/verify', (req, res) => {
    // toggle this flag to quickly disable all clients if needed
    const serviceActive = true; // change to false to disable extension remotely
    res.json({ active: serviceActive });
});

// --- ROOT ROUTE ---
app.get('/', (req, res) => res.send('Ebiana Extension Auth Server Running...'));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


//JWT_SECRET=asd78900securelongsecret
//https://ext-irri-auth-server-production.up.railway.app/