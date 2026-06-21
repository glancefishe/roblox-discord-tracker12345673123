const express = require('express');
const app = express();
const { verifyKey } = require('discord-interactions');

const DISCORD_PUBLIC_KEY = "40cdc673dc778ec008f6d8674c356a9770b2294852b1e0805dba652df951fe2c";

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
