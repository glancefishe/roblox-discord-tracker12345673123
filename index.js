const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}));

const ROBLOX_SECRET = "YourSuperSecretPassword123";
const DISCORD_PUBLIC_KEY = "9426f01c17edc22e410cb43f0d387d12527a344d1d4af76333b24c71ee38d84d"; 
let trackingCache = {}; 

// 1. ROBLOX INCOMING DATA ENDPOINT
app.post('/api/update-data', (req, res) => {
    if (req.headers.authorization !== ROBLOX_SECRET) return res.status(401).send('Unauthorized');
    const { jobId, players } = req.body;
    trackingCache[jobId] = players;
    res.status(200).send('Synced');
});

// 2. DISCORD APPLICATION SLASH COMMAND ENDPOINT
app.post('/api/interactions', (req, res) => {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    
    if (!signature || !timestamp) return res.status(401).send('Missing signatures');

    // Cryptographic validation using raw hex keys
    const isValid = crypto.verify(
        null, 
        Buffer.concat([Buffer.from(timestamp), req.rawBody]), 
        {
            key: Buffer.from(DISCORD_PUBLIC_KEY, 'hex'),
            format: 'raw',
            type: 'public'
        }, 
        Buffer.from(signature, 'hex')
    );
    if (!isValid) return res.status(401).send('Invalid request signature');

    const interaction = req.body;
    if (interaction.type === 1) return res.status(200).json({ type: 1 });

    if (interaction.type === 2 && interaction.data.name === 'search') {
        const targetName = interaction.data.options[0].value.toLowerCase();
        let foundPlayer = null;

        for (const jobId in trackingCache) {
            const match = trackingCache[jobId].find(p => p.username.toLowerCase() === targetName);
            if (match) { foundPlayer = match; break; }
        }

        if (!foundPlayer) {
            return res.status(200).json({
                type: 4,
                data: { content: `❌ No live profile tracking found for **${targetName}**.` }
            });
        }

        const itemsText = foundPlayer.inventory.join(', ') || 'No items';

        return res.status(200).json({
            type: 4,
            data: {
                embeds: [{
                    color: 5793266,
                    title: `🔍 Profile Tracker: ${foundPlayer.displayName}`,
                    fields: [
                        { name: 'Username', value: `@${foundPlayer.username}`, inline: true },
                        { name: 'User ID', value: `${foundPlayer.userId}`, inline: true },
                        { name: 'Balance', value: `🪙 ${foundPlayer.cash}`, inline: true },
                        { name: 'Inventory Assets', value: itemsText, inline: false }
                    ]
                }]
            }
        });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('App system ready'));
