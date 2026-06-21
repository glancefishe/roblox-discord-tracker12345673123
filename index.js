const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const app = express();

const ROBLOX_SECRET = "YourSuperSecretPassword123";
const DISCORD_PUBLIC_KEY = "9426f01c17edc22e410cb43f0d387d12527a344d1d4af76333b24c71ee38d84d"; 
let trackingCache = {}; 

// 1. ROBLOX INCOMING DATA ENDPOINT
app.post('/api/update-data', express.json(), (req, res) => {
    if (req.headers.authorization !== ROBLOX_SECRET) return res.status(401).send('Unauthorized');
    const { jobId, players } = req.body;
    trackingCache[jobId] = players;
    res.status(200).send('Synced');
});

// 2. DISCORD APPLICATION SLASH COMMAND ENDPOINT
app.post('/api/interactions', verifyKeyMiddleware(DISCORD_PUBLIC_KEY), (req, res) => {
    const interaction = req.body;

    if (interaction.type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data.name === 'search') {
        const targetName = interaction.data.options[0].value.toLowerCase();
        let foundPlayer = null;

        for (const jobId in trackingCache) {
            const match = trackingCache[jobId].find(p => p.username.toLowerCase() === targetName);
            if (match) { foundPlayer = match; break; }
        }

        if (!foundPlayer) {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `❌ No live profile tracking found for **${targetName}**.` }
            });
        }

        const itemsText = foundPlayer.inventory.join(', ') || 'No items';

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
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
