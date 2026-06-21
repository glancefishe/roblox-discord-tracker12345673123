const express = require('express');
const app = express();
const { verifyKey } = require('discord-interactions');

const DISCORD_PUBLIC_KEY = "9426f01c17edc22e410cb43f0d387d12527a344d1d4af76333b24c71ee38d84d";

app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.post('/api/interactions', (req, res) => {
    const signature = req.get('x-signature-ed25519');
    const timestamp = req.get('x-signature-timestamp');

    // Manually verify
    const isValid = verifyKey(req.rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
    
    if (!isValid) {
        return res.status(401).send('Invalid request signature');
    }

    // Ping/Pong handshake
    if (req.body.type === 1) {
        return res.json({ type: 1 });
    }

    return res.status(200).send('OK');
});

app.listen(process.env.PORT || 3000, () => console.log('App system ready'));
