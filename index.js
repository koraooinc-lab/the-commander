require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const officeChannelId = '1506359452184608939';
const strikes = new Map();

// --- 🛡️ THE SCRIPTURE ARMORY (30 RANDOM VERSES) ---
const bibleArmory = [
    `Ephesians 4:29 ("Let no corrupting talk come out of your mouths.")`,
    `Colossians 3:8 ("Put away: anger, wrath, malice, slander, and obscene talk.")`,
    `Psalm 141:3 ("Set a guard, O Lord, over my mouth; keep watch over the door of my lips!")`,
    `Proverbs 21:23 ("Whoever keeps his mouth and his tongue keeps himself out of trouble.")`,
    `Matthew 12:36 ("People will give account for every careless word they speak.")`,
    `Proverbs 15:1 ("A soft answer turns away wrath, but a harsh word stirs up anger.")`,
    `Proverbs 12:18 ("There is one whose rash words are like sword thrusts.")`,
    `James 1:19-20 ("Be quick to hear, slow to speak, slow to anger.")`,
    `Matthew 5:22 ("Everyone who is angry with his brother will be liable to judgment.")`,
    `Ephesians 4:31 ("Let all bitterness and wrath and anger be put away from you.")`,
    `Proverbs 29:11 ("A fool gives full vent to his spirit, but a wise man holds it back.")`,
    `Proverbs 11:12 ("Whoever belittles his neighbor lacks sense.")`,
    `Proverbs 18:7 ("A fool’s mouth is his ruin, and his lips are a snare to his soul.")`,
    `Proverbs 10:19 ("When words are many, transgression is not lacking.")`,
    `Ecclesiastes 10:12 ("A wise man's mouth wins him favor, but the lips of a fool consume him.")`,
    `Proverbs 13:3 ("Whoever guards his mouth preserves his life.")`,
    `Proverbs 17:28 ("Even a fool who keeps silent is considered wise.")`,
    `Matthew 15:11 ("It is not what goes into the mouth that defiles, but what comes out.")`,
    `Luke 6:45 ("Out of the abundance of the heart his mouth speaks.")`,
    `Psalm 19:14 ("Let the words of my mouth be acceptable in your sight.")`,
    `Proverbs 15:4 ("A gentle tongue is a tree of life, but perverseness in it breaks the spirit.")`,
    `James 3:5 ("The tongue is a small member, yet it boasts of great things.")`,
    `Proverbs 16:23 ("The heart of the wise makes his speech judicious.")`,
    `Proverbs 25:28 ("A man without self-control is like a city broken into and left without walls.")`,
    `Proverbs 14:29 ("Whoever is slow to anger has great understanding.")`,
    `Psalm 34:13 ("Keep your tongue from evil and your lips from speaking deceit.")`,
    `Proverbs 12:16 ("The vexation of a fool is known at once, but the prudent ignores an insult.")`,
    `Proverbs 15:2 ("The tongue of the wise commends knowledge, but the mouths of fools pour out folly.")`,
    `James 3:10 ("From the same mouth come blessing and cursing. This ought not be so.")`,
    `Proverbs 10:14 ("The wise lay up knowledge, but the mouth of a fool brings ruin near.")`
];

// --- 🦯 THE DISCIPLINE SNARK (30 RANDOM REMARKS FOR CUSSING) ---
const snarkyRemarks = [
    `"Crude profanity. The crutch of a feeble, uneducated mind."`,
    `"Your mind belongs in the gutter of The Scar. Do not bring that filth here."`,
    `"Insolence. You mistake cruelty for a show of strength. A pathetic display."`,
    `"Speak like a soldier, not a babbling simpleton. Clean it up."`,
    `"Your lack of discipline is offensive. It is a signal flare of your own insecurities."`,
    `"A weapon with a flaw is a liability. Your mouth is your greatest flaw."`,
    `"Impulse is the purest form of weakness. You have just broadcast yours to the entire board."`,
    `"Did you learn that vocabulary in a cage of sawdust? You are no longer in the pit, recruit."`,
    `"You are moving like a pawn. Stop dancing and hold your ground with dignity."`,
    `"Your frustration is a useless indulgence. Channel it into something more productive than filth."`,
    `"I have seen men disemboweled for less than that slip of the tongue."`,
    `"Your tongue is a blunt instrument. In my world, such inefficiency leads to a shallow grave."`,
    `"Observe the board. You are currently a pawn shouting at a hurricane. Be silent."`,
    `"That remark was telegraphed from across the city. Sloppy. Unrefined. Predictable."`,
    `"Is that the best your intellect can muster? A handful of dirt thrown from the gutter?"`,
    `"You are a smudge on an otherwise clean page. Scrub yourself of this filth."`,
    `"Invisibility can be a weapon, recruit. But your mouth makes you a very loud target."`,
    `"You are a leaf in the wind. Root yourself in discipline or be swept away."`,
    `"I require instruments of singular violence, not children with unwashed mouths."`,
    `"A simpleton from the provinces could speak with more grace than you just displayed."`,
    `"You are acting like a cornered rat. All teeth and no strategy. Calm yourself."`,
    `"I have no interest in your soul, recruit. But I will have your respect. Clean it up."`,
    `"That was a desperate, undisciplined move. The move of a loser. Do better."`,
    `"Information is the truest currency of power. And you just told me you have none."`,
    `"Your internal architecture is brittle. One more crack and you will shatter completely."`,
    `"I am not a tavern keeper. I will not tolerate this common brawling in my garrison."`,
    `"You are attempting to use noise to distract from your lack of skill. It isn't working."`,
    `"A master strategist knows when to be silent. You clearly have a great deal to learn."`,
    `"Your speech is as unvarnished as the rot in a tenement wall. Fix it."`,
    `"That was an act of pure spite. A pointless waste of energy on a board that doesn't care."`
];

// --- 🗣️ THE INTERJECTION SNARK (30 RANDOM REMARKS FOR SOCIAL TRIGGER WORDS) ---
const interjectionSnark = [
    `"A curious topic of conversation. Do not let it distract you from the board."`,
    `"You speak of things you barely comprehend. Typical."`,
    `"I am listening, recruit. Be careful what you reveal."`,
    `"A minor detail in the grand strategy. Proceed."`,
    `"Your perspective is limited. You see the grain of wood; I see the forest."`,
    `"Domestic prattle. The board is moving while you gossip."`,
    `"An interesting observation. Perhaps there is hope for you yet."`,
    `"Is this the best use of your mental energy? I think not."`,
    `"The 'Master Architect' has no time for idle chatter. Get to work."`,
    `"You talk too much. A silent soldier is a lethal one."`,
    `"Why are you discussing such trivialities? The enemy is at the gates."`,
    `"I have noted your interests. Every piece of information is a weapon."`,
    `"Do not mistake my silence for disinterest. I am cataloging every word."`,
    `"Your logic is flawed, but your enthusiasm is... adequate."`,
    `"A predictable thought. You move exactly how I expected you to."`,
    `"Stop looking at the spotlight. Look at the shadows. That is where the game is won."`,
    `"You sound like a merchant haggling over spoiled fish. Have some dignity."`,
    `"A strategy is being formed. Your 'input' is not required, recruit."`,
    `"You speak of freedom? You are a passenger on a horse you don't control."`,
    `"Sentimentality is a rot. Cut it out before it spreads."`,
    `"I see you are attempting to think. Don't strain yourself."`,
    `"The board doesn't care about your opinions. It only cares about results."`,
    `"You are a pawn dreaming of being a King. Focus on your next square first."`,
    `"That information is irrelevant. You are missing the primary objective."`,
    `"I have heard better conversations in the back room of The Leaky Mug."`,
    `"You are broadcasting your position. Subtlety is clearly a foreign concept to you."`,
    `"Your 'insight' is as watery as the light in The Scar."`,
    `"An appalling lack of focus. Get your mind back on the mission."`,
    `"I require instruments of violence, not a circle of gossiping washers-women."`,
    `"Is there a point to this, or are you just fond of the sound of your own voice?"`
];

// Words that trigger the interjections above (No punishment, just talk)
const socialTriggers = ['art', 'chess', 'stew', 'master', 'architect', 'flock', 'yahweh', 'victory', 'fail', 'manga', 'drawing', 'writing', 'book', 'game', 'pawn', 'rook', 'king'];

const commands = [
    new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a word to the Commander\'s hit-list.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('category')
                .setDescription('Category of the word')
                .setRequired(true)
                .addChoices(
                    { name: 'Profanity', value: 'profanity' },
                    { name: 'Degrading', value: 'degrading' },
                    { name: 'Bully', value: 'bully' }
                ))
        .addStringOption(option => 
            option.setName('word')
                .setDescription('The word to ban')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`[SYSTEM] Commander Felcher#5029 is online. Social & Combat modules active.`);
    } catch (error) { console.error(error); }
});

client.on('messageDelete', async message => {
    if (message.author?.bot || !message.content) return;
    const officeChannel = client.channels.cache.get(officeChannelId);
    if (officeChannel) {
        await officeChannel.send(`> 👁️ **[SURVEILLANCE LOG]** Recruit **${message.author.username}** attempted to erase intel in <#${message.channel.id}>: "${message.content}"`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();
    const cleanMsg = msg.replace(/['’]/g, '').replace(/\s+/g, ' ');

    // 1. CHECK FOR VIOLATIONS (Punishment logic)
    const wordsDB = JSON.parse(fs.readFileSync('./violations.json'));
    let triggeredViolation = false;
    for (const [category, words] of Object.entries(wordsDB)) {
        if (words.some(word => cleanMsg.includes(word))) {
            triggeredViolation = true;
            break;
        }
    }

    if (triggeredViolation) {
        await message.delete().catch(() => {});
        let userStrikes = (strikes.get(message.author.id) || 0) + 1;
        strikes.set(message.author.id, userStrikes);

        const randomSnark = snarkyRemarks[Math.floor(Math.random() * snarkyRemarks.length)];
        const randomVerse = bibleArmory[Math.floor(Math.random() * bibleArmory.length)];

        if (userStrikes === 1) {
            await message.channel.send(`> 📖 **[COMMANDER FELCHER]**\n> *Slams Bible.*\n> ${randomSnark}\n> \n> **Assignment:** Read **${randomVerse}**.`);
        } else {
            try {
                if (message.member.manageable) await message.member.timeout(10 * 60 * 1000);
                await message.channel.send(`> ⛓️ **[COMMANDER FELCHER]**\n> *Drags <@${message.author.id}> to the dungeon.*\n> "You failed to learn. Meditate on **${randomVerse}**."`);
            } catch (e) {
                await message.channel.send(`> 📖 **[COMMANDER FELCHER]**\n> <@${message.author.id}>, read: **${randomVerse}**`);
            }
        }
        return; // Stop here if it was a violation
    }

    // 2. CHECK FOR SOCIAL TRIGGERS (Insertion logic)
    const isSocialTrigger = socialTriggers.some(trigger => cleanMsg.includes(trigger));
    if (isSocialTrigger) {
        const randomInterjection = interjectionSnark[Math.floor(Math.random() * interjectionSnark.length)];
        await message.channel.send(`> 🦯 **[COMMANDER FELCHER]**\n> ${randomInterjection}`);
    }
});

// Slash Commands
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
            await interaction.reply({ content: `> 🦯 Already recorded.`, ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);