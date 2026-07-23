const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalFollow } } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const { OpenAI } = require('openai');
const config = require('./config.json');

// Initialize OpenAI client
let openai = null;
if (config.ai && config.ai.enabled) {
    openai = new OpenAI({
        apiKey: config.ai.apiKey,
        baseURL: config.ai.baseUrl || 'https://api.openai.com/v1'
    });
}

const chatHistory = [];
let guardedPlayer = null;
let guardInterval = null;

function pushToHistory(role, content) {
    chatHistory.push({ role, content });
    const maxHistory = config.ai.maxHistoryMessages || 10;
    while (chatHistory.length > maxHistory) {
        chatHistory.shift();
    }
}

function createBot() {
    console.log(`[*] Connecting to ${config.server.host}:${config.server.port}...`);
    
    const bot = mineflayer.createBot({
        host: config.server.host,
        port: config.server.port,
        username: config.identity.username,
        auth: config.server.auth, 
        version: config.server.version
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    bot.on('login', () => {
        console.log(`[+] Successfully logged in as ${bot.username}`);
    });

    bot.on('spawn', () => {
        console.log(`[+] Bot spawned! Initializing.`);
        
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);

        if (config.identity.skinName?.trim()) {
            bot.chat(`/skin set ${config.identity.skinName}`);
        }
        if (config.identity.displayName?.trim()) {
            bot.chat(`/nick ${config.identity.displayName}`);
        }
    });

    // Chat Handler Engine
    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;

        const lowerMsg = message.toLowerCase();
        const botNameLower = config.identity.username.toLowerCase();
        const displayLower = config.identity.displayName ? config.identity.displayName.toLowerCase() : "";

        // 1. Determine if AI should be triggered
        const isMentioned = lowerMsg.includes(botNameLower) || (displayLower && lowerMsg.includes(displayLower));
        const isCommand = lowerMsg.includes('!follow') || lowerMsg.includes('!defend') || lowerMsg.includes('!stop');
        const isPrefixed = message.startsWith(config.ai.triggerPrefix);

        const shouldTriggerAi = config.ai.enabled && (isMentioned || isCommand || isPrefixed);

        const playerEntity = bot.players[username]?.entity;
        let actionTaken = ''; // System note to pass to the AI

        // 2. Execute Commands Silently
        if (lowerMsg.includes('!follow')) {
            if (!playerEntity) {
                actionTaken = `(System Note: You could not follow ${username} because they are out of render distance.)`;
            } else {
                stopGuardMode();
                bot.pvp.stop();
                bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true);
                actionTaken = `(System Note: You executed the command and are now following ${username}.)`;
            }
        } else if (lowerMsg.includes('!defend')) {
            if (!playerEntity) {
                actionTaken = `(System Note: You could not defend ${username} because they are out of render distance.)`;
            } else {
                stopGuardMode();
                guardedPlayer = username;
                bot.pathfinder.setGoal(new GoalFollow(playerEntity, 3), true);
                
                guardInterval = setInterval(() => {
                    const targetPlayer = bot.players[guardedPlayer]?.entity;
                    if (!targetPlayer) return;
                    const mob = bot.nearestEntity(e => 
                        e.type === 'mob' && e.kind === 'Hostile monsters' && e.position.distanceTo(targetPlayer.position) < 16
                    );
                    if (mob && !bot.pvp.target) {
                        const sword = bot.inventory.items().find(item => item.name.includes('sword'));
                        if (sword) bot.equip(sword, 'hand');
                        bot.pvp.attack(mob);
                    }
                }, 1000);
                actionTaken = `(System Note: You executed the command and are now aggressively defending ${username} from mobs.)`;
            }
        } else if (lowerMsg.includes('!stop')) {
            stopGuardMode();
            bot.pathfinder.setGoal(null);
            bot.pvp.stop();
            actionTaken = `(System Note: You stopped all previous tasks and are now standing by.)`;
        }

        // 3. Process AI Generation
        if (shouldTriggerAi) {
            // Strip the prefix if they used it, otherwise send the full message
            let userPrompt = message;
            if (isPrefixed) {
                userPrompt = message.slice(config.ai.triggerPrefix.length).trim();
            }

            // Prevent completely empty prompts from crashing the AI
            if (!userPrompt || userPrompt.trim() === "") {
                console.log(`[*] Skipped empty prompt from ${username}`);
                return; 
            }

            // Merge the user's chat with the backend result so the AI knows what happened
            let aiContextMsg = `${username}: ${userPrompt}`;
            if (actionTaken) {
                aiContextMsg += ` ${actionTaken}`;
            }

            console.log(`[*] Generating AI response for -> ${aiContextMsg}`);

            try {
                const apiMessages = [
                    { role: 'system', content: config.ai.systemPrompt },
                    ...chatHistory,
                    { role: 'user', content: aiContextMsg }
                ];

                const response = await openai.chat.completions.create({
                    model: config.ai.model,
                    messages: apiMessages,
                    max_tokens: 120
                });

                // Safe Array Parsing: The '?.' prevents the bot from crashing if 'choices' is missing
                const reply = response?.choices?.[0]?.message?.content?.trim();
                
                if (reply) {
                    const cleanReply = reply.replace(/[\r\n]+/g, ' ');
                    
                    // Save to memory
                    pushToHistory('user', `${username}: ${userPrompt}`);
                    pushToHistory('assistant', cleanReply);
                    
                    bot.chat(cleanReply);
                } else {
                    // Debugging: Print exactly what the provider returned instead of crashing
                    console.error(`[-] API returned an unexpected format:`, JSON.stringify(response, null, 2));
                    bot.chat(`My brain received scrambled data!`);
                }
            } catch (err) {
                console.error(`[-] AI Request failed: ${err.message}`);
                bot.chat(`I'm having trouble thinking right now.`);
            }
        }
    });

    function stopGuardMode() {
        if (guardInterval) {
            clearInterval(guardInterval);
            guardInterval = null;
        }
        guardedPlayer = null;
    }

    bot.on('kicked', (reason) => console.log(`[-] Bot kicked: ${reason}`));
    bot.on('error', (err) => console.error(`[-] Error: ${err.message}`));

    bot.on('end', () => {
        stopGuardMode();
        console.log(`[!] Disconnected. Reconnecting in 10 seconds...`);
        setTimeout(createBot, 10000);
    });
}

createBot();
