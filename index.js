require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const express = require('express');

// --- 0. HEARTBEAT WEB SERVER (Keeps him alive 24/7 in the cloud) ---
const app = express();
app.get('/', (req, res) => res.send('Commander Felcher is sipping chicory and watching the board.'));
app.listen(3000, () => console.log('[SYSTEM] Heartbeat initiated.'));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const officeChannelId = '1506359452184608939';

// The Ledger (Remembers strikes)
const strikes = new Map();

// --- 12-HOUR AUTO-RESET ---
// Clears the strike ledger every 12 hours automatically
setInterval(() => {
    strikes.clear();
    console.log('[SYSTEM] 12-Hour Timer: The strike ledger has been wiped clean.');
}, 12 * 60 * 60 * 1000);

// --- 📖 THE SCRIPTURE ASSIGNMENTS (30 References for the Bible Bot) ---
const bibleArmory = [
    'Ephesians 4:29', 'Colossians 3:8', 'Psalm 141:3', 'Proverbs 21:23', 'Matthew 12:36',
    'Proverbs 15:1', 'Proverbs 12:18', 'James 1:19', 'Matthew 5:22', 'Ephesians 4:31',
    'Proverbs 29:11', 'Proverbs 11:12', 'Proverbs 18:7', 'Proverbs 10:19', 'Ecclesiastes 10:12',
    'Proverbs 13:3', 'Proverbs 17:28', 'Matthew 15:11', 'Luke 6:45', 'Psalm 19:14',
    'Proverbs 15:4', 'James 3:5', 'Proverbs 16:23', 'Proverbs 25:28', 'Proverbs 14:29',
    'Psalm 34:13', 'Proverbs 12:16', 'Proverbs 15:2', 'James 3:10', 'Proverbs 10:14'
];

// --- ☕ THE PASSIVE-AGGRESSIVE ROASTS (20 Remarks) ---
const snarkyRemarks = [
    "Oh, look. The pawn is attempting to speak. How exhausting.",
    "Did your keyboard break, or is typing with dignity simply too taxing for your current mental state?",
    "Are we projecting our insecurities onto the server today? Do let me know when your tantrum is finished.",
    "I was enjoying a quiet cup of chicory before you decided to share that deeply mediocre thought.",
    "I have seen feral dogs with better manners. Do try to elevate yourself.",
    "A fascinating display of linguistic incompetence. Please, spare us the sequel.",
    "You mistake volume for intellect. It is a very common, very boring mistake.",
    "I am not angry, recruit. I am just profoundly disappointed in your vocabulary.",
    "Is this the pinnacle of your mental capacity? I genuinely pity you.",
    "I would ask what you were thinking, but it is clear you weren't.",
    "Another predictable outburst. You are moving exactly how I expected you to.",
    "Please, take a deep breath and try communicating like someone who has read a book.",
    "I’ve scraped more intelligent conversations off my boots.",
    "Your lack of emotional control is giving me a headache.",
    "Such crude language. You must be very proud of yourself.",
    "I suppose I must remind you again that you are not in a tavern. Act accordingly.",
    "If you are trying to impress someone with your edge, I assure you, it is failing.",
    "A deeply uninspired choice of words. You bore me, recruit.",
    "I would engage with you, but I don't debate with unarmed opponents.",
    "Do us all a favor and keep those thoughts confined to the privacy of your own head."
];

// --- 📝 COMMAND REGISTRATION ---
const commands = [
    new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a word to the Commander\'s hit-list.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('category').setDescription('Category').setRequired(true)
                .addChoices({ name: 'Profanity', value: 'profanity' }, { name: 'Degrading', value: 'degrading' }, { name: 'Bully', value: 'bully' }))
        .addStringOption(option => option.setName('word').setDescription('The word to ban').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('ledger')
        .setDescription('Check how many strikes a recruit currently has.')
        .addUserOption(option => option.setName('recruit').setDescription('The user to check').setRequired(true)),

    new SlashCommandBuilder()
        .setName('pardon')
        .setDescription('Wipe a recruit\'s strikes clean (Admin only).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('recruit').setDescription('The user to pardon').setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`[SYSTEM] Commander Felcher is online. Commands, Ledger, and Roasts loaded.`);
    } catch (error) { console.error(error); }
});

// --- 👁️ SNIPER PROTOCOL ---
client.on('messageDelete', async message => {
    if (message.author?.bot || !message.content) return;
    const officeChannel = client.channels.cache.get(officeChannelId);
    if (officeChannel) {
        await officeChannel.send(`> 👁️ **[SURVEILLANCE LOG]** Recruit **${message.author.username}** attempted to erase intel in <#${message.channel.id}>: "${message.content}"`);
    }
});

// --- ☕ THE DISCIPLINE & STRIKE PROTOCOL ---
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!ping') {
        return message.reply("> ☕ **[COMMANDER FELCHER]**\n> I am sipping my chicory and watching the board. What do you want, recruit?");
    }

    const msg = message.content.toLowerCase();
    const cleanMsg = msg.replace(/['’]/g, '').replace(/\s+/g, ' ');

    let wordsDB;
    try { wordsDB = JSON.parse(fs.readFileSync('./violations.json')); } 
    catch (e) { return; }

    let triggeredViolation = false;
    for (const [category, words] of Object.entries(wordsDB)) {
        if (words.some(word => new RegExp(`\\b${word}\\b`, 'i').test(cleanMsg) || cleanMsg.includes(word))) {
            triggeredViolation = true; break;
        }
    }

    if (triggeredViolation) {
        let userStrikes = (strikes.get(message.author.id) || 0) + 1;
        strikes.set(message.author.id, userStrikes);

        const randomSnark = snarkyRemarks[Math.floor(Math.random() * snarkyRemarks.length)];
        const randomVerse = bibleArmory[Math.floor(Math.random() * bibleArmory.length)];

        if (userStrikes === 1) {
            // STRIKE 1: DO NOT DELETE. Just Warn.
            await message.reply(`> ☕ **[COMMANDER FELCHER]**\n> Ah. A mistake. I will leave this here so everyone can see your lack of vocabulary.\n> Be warned: you have **5 strikes** until you are placed in timeout, and any future profanity will be erased from my board.\n> \n> **Strike: 1/5**\n> **Assignment:** Read ${randomVerse}`);
        } 
        else if (userStrikes >= 2 && userStrikes <= 4) {
            // STRIKES 2, 3, 4: Delete and Roast.
            await message.delete().catch(() => {});
            await message.channel.send(`> ☕ **[COMMANDER FELCHER]**\n> <@${message.author.id}>, ${randomSnark}\n> \n> **Strike: ${userStrikes}/5**\n> **Assignment:** Read ${randomVerse}`);
        } 
        else if (userStrikes >= 5) {
            // STRIKE 5: The Dungeon
            await message.delete().catch(() => {});
            try {
                if (message.member.manageable) await message.member.timeout(10 * 60 * 1000, 'Reached 5 Strikes.');
                await message.channel.send(`> ⛓️ **[COMMANDER FELCHER]**\n> <@${message.author.id}> has exhausted my patience. You are immobilized for 10 minutes. Sit in the corner in silence and think about why you are like this.\n> \n> **Read:** ${randomVerse}`);
            } catch (e) {
                await message.channel.send(`> ☕ **[COMMANDER FELCHER]**\n> <@${message.author.id}>, your rank protects you from the timeout, but you have hit 5 strikes. How embarrassing for leadership. Read ${randomVerse}`);
            }
        }
    }
});

// --- 📋 SLASH COMMANDS (/add, /ledger, /pardon) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'add') {
        const category = interaction.options.getString('category');
        const newWord = interaction.options.getString('word').toLowerCase();
        const wordsDB = JSON.parse(fs.readFileSync('./violations.json'));
        
        if (!wordsDB[category].includes(newWord)) {
            wordsDB[category].push(newWord);
            fs.writeFileSync('./violations.json', JSON.stringify(wordsDB, null, 2));
            await interaction.reply({ content: `> 👁️ Intel updated. **"${newWord}"** added to **${category}** ledger.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `> ☕ Already recorded. Don't waste my time.`, ephemeral: true });
        }
    }

    if (interaction.commandName === 'ledger') {
        const target = interaction.options.getUser('recruit');
        const userStrikes = strikes.get(target.id) || 0;
        await interaction.reply(`> 🗄️ **[COMMANDER FELCHER]**\n> Let us review the file. Recruit <@${target.id}> currently has **${userStrikes}/5** strikes on the board today.`);
    }

    if (interaction.commandName === 'pardon') {
        const target = interaction.options.getUser('recruit');
        strikes.delete(target.id);
        await interaction.reply(`> 🕊️ **[COMMANDER FELCHER]**\n> The Master Architect has decided to pardon <@${target.id}>. Their strikes have been wiped clean. I, however, will continue to judge them silently.`);
    }
});

client.login(process.env.TOKEN);
