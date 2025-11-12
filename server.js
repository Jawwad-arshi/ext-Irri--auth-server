const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-strong-secret';
const TOKEN_TTL_SEC = 5 * 60; // 3 days
//const TOKEN_TTL_SEC = 3 * 24 * 60 * 60; // 3 days

// In-memory allowlist / blacklist for demonstration (use DB in production)
const issuedTokens = new Set();
const revokedTokens = new Set();

// Simple admin endpoint: exchange a one-time password for a token
// (you can protect this with a stronger admin auth)
app.post('/api/get-token', (req, res) => {
    const { password } = req.body;
    // Replace with your real password or admin-check
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ ok: false, error: 'Invalid password' });
    }
    const payload = { issuedAt: Date.now() };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
    issuedTokens.add(token);
    res.json({ ok: true, token, expiresIn: TOKEN_TTL_SEC });
});

// Validate token endpoint used by extension
app.post('/api/validate', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ ok: false, error: 'missing token' });
    if (revokedTokens.has(token)) return res.status(403).json({ ok: false, error: 'revoked' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ ok: false, error: 'invalid' });
        // optional: check token exists in issuedTokens set
        // if (!issuedTokens.has(token)) return res.status(403).json({ ok:false, error:'not issued' });
        return res.json({ ok: true, expiresAt: Date.now() + 1000 * TOKEN_TTL_SEC });
    });
});

// Admin revoke endpoint for token
app.post('/api/revoke', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ ok: false, error: 'missing token' });
    revokedTokens.add(token);
    res.json({ ok: true });
});

app.get('/', (req, res) => res.send('Ebiana Extension auth server'));

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

