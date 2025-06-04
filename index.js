const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Embed,
} = require('discord.js');
require('dotenv').config();

const fetch = require('node-fetch');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

const { ActivityType } = require('discord.js');

const economy = new Map();

const spamOffenses = new Map();

const sendDM = async (user, content) => {
  try {
    const dm = await user.createDM();
    await dm.send(content);
  } catch (err) {
    console.warn(`Failed to DM ${user.tag}:`, err.message);
  }
};

const ticketInfo = new Map();

const recentMessages = new Map();

const config = {
  ticketRole: '1369334028544639017',
  categoryId: '1369016919058940088',
  logChannelId: '1369330280426373344',
  autoRoleId: '1369021498190200945',
};

const commands = [

  new SlashCommandBuilder()
  .setName('cat')
  .setDescription('find an image of a cat'),

  new SlashCommandBuilder()
  .setName('nickname')
  .setDescription('Change a user\'s nickname.')
  .addUserOption((opt) =>
    opt.setName('user').setDescription('User to nickname').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('nickname').setDescription('New nickname').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  new SlashCommandBuilder()
  .setName('lion')
  .setDescription('Finds an image of a skibidi lion'),

  new SlashCommandBuilder()
  .setName('support')
  .setDescription('Helps with a lot of things you have.'),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to ban').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to kick').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Ask the magic 8ball a question.')
  .addStringOption((opt) =>
    opt.setName('question').setDescription('Your question').setRequired(true)
  ),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to mute').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to unmute').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to warn').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages.')
    .addIntegerOption((opt) =>
      opt.setName('amount').setDescription('Number of messages').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID.')
    .addStringOption((opt) =>
      opt.setName('userid').setDescription('The ID of the user to unban').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send ticket panel.')
    .addChannelOption((opt) =>
      opt.setName('channel').setDescription('Target channel').setRequired(true)
    ),

  new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Get bot latency.'),

  new SlashCommandBuilder()
  .setName('hug')
  .setDescription('Gives a hug to someone!')
  .addUserOption((opt) =>
    opt.setName('user').setDescription('The person you want to hug').setRequired(true)
  ),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something.')
    .addStringOption((opt) =>
      opt.setName('text').setDescription('Text to say').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get info about a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to check').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('dmcapeid')
    .setDescription('Send cape ID to user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to DM').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('cape').setDescription('Cape to DM').setRequired(true)
    )
    .addNumberOption((opt) =>
      opt.setName('id').setDescription('ID to DM').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('roleadd')
    .setDescription('Add a role to a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to give the role to').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role to give').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('roleremove')
    .setDescription('Remove a role from a user.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to remove the role from').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role to remove').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
];

client.once('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    {
      body: commands.map((cmd) => cmd.toJSON()),
    }
  );

  client.user.setActivity(process.env.STATUS, { type: ActivityType.Watching });

  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const role = member.guild.roles.cache.get(config.autoRoleId);
  if (role) {
    await member.roles.add(role).catch(() => {});
    console.log(`✅ Gave ${member.user.tag} the Member role.`);
  }
});

const getRoast = async () => {
  try {
    const res = await fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json');
    const data = await res.json();
    return data.insult || "You're not even worth roasting.";
  } catch (err) {
    console.error('Roast API error:', err);
    return "Roast generator failed. You're lucky... for now.";
  }
};

async function punishSpammer(user, guild) {
  const userId = user.id;
  let offense = spamOffenses.get(userId) || 0;
  offense++;
  spamOffenses.set(userId, offense);

  const durations = [
    10 * 60_000,
    30 * 60_000,
    60 * 60_000,
    10 * 60 * 60_000,
    24 * 60 * 60_000,
    7 * 24 * 60 * 60_000,
    21 * 24 * 60 * 60_000
  ];

  const duration = durations[Math.min(offense - 1, durations.length - 1)];

  try {
    const member = await guild.members.fetch(userId);
    await member.timeout(duration, `Spamming offense #${offense}`);
    await sendDM(user, `🚫 You were timed out for **spamming** (Offense #${offense})\nDuration: **${Math.floor(duration / 60000)} minutes**`);
    console.log(`Timed out ${user.tag} for spam (Offense ${offense})`);
  } catch (err) {
    console.error(`Failed to timeout ${user.tag}:`, err);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const now = Date.now();
  const userId = message.author.id;
  const msgData = recentMessages.get(userId) || { lastMsg: '', lastTime: 0 };

  if (
    msgData.lastMsg === message.content &&
    now - msgData.lastTime < 5000
  ) {
    await punishSpammer(message.author, message.guild);
  }

  recentMessages.set(userId, { lastMsg: message.content, lastTime: now });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
    const log = async (description) => {
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🛠️ Moderation Log')
          .setDescription(description)
          .setColor('#e74c3c')
          .setTimestamp()
          .setFooter({ text: `Moderator: ${interaction.user.tag}` });
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    };

    if (commandName === 'ping') {
      await interaction.reply(`🏓 Pong! Latency: \`${client.ws.ping}ms\``);
    }
    else if (commandName === 'say') {
      const text = options.getString('text');
      console.log(`${interaction.user.tag}`);

      await interaction.reply({ content: '📢 Sent your message.', ephemeral: true });
      await interaction.channel.send(text);

    }
    else if (commandName === 'dmcapeid') {
      const user = options.getUser('user');
      const id = options.getNumber('id');
      const cape = options.getString('cape');
      const cmdUser = interaction.user.tag;
      const message = `Thank you for ordering the ${cape} Cape. Your cape ID is ${id}, if you have any issues with your cape, do not hesitate to contact the HC Administration Cape or @${cmdUser}.`;

      await user.send(message);
      await interaction.reply({ content: `✅ Sent cape info to ${user.tag}` });
    }
    else if (commandName === 'nickname') {
  const member = interaction.guild.members.cache.get(options.getUser('user').id);
  const newNick = options.getString('nickname');

  if (!member) {
    return await interaction.reply({ content: '❌ Member not found.', ephemeral: true });
  }

  try {
    await member.setNickname(newNick);
    await interaction.reply({ content: `✅ Changed nickname of **${member.user.tag}** to \`${newNick}\``, ephemeral: true });
    await log(`✏️ **${interaction.user.tag}** changed nickname of **${member.user.tag}** to \`${newNick}\``);
  } catch (err) {
    await interaction.reply({ content: '❌ Failed to change nickname. Do I have permission?', ephemeral: true });
  }
}
      else if (commandName === 'support') {
  const user = interaction.user;

  const supportMessage = `
**You are not Alone**
If you're feeling overwhelmed, hopeless, or thinking about suicide, please know that there is help available and people who care about you.

**Reach Out for Help:**
• USA: 988 or 1-800-273-TALK (8255)  
• UK: 116 123 (Samaritans)  
• Canada: 1-833-456-4566  
• Australia: 13 11 14  
• Or visit [Helpline](https://findahelpline.com) for more options worldwide.

**You are important. You matter. Talking to someone can help.**

We care about you. Please don’t hesitate to reach out.`;

  try {
    await sendDM(user, supportMessage);
    await interaction.reply({
      content: 'Please check your DMs.',
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: 'I couldn’t send you a DM. Please make sure your DMs are open.',
      ephemeral: true
    });
  }
}

    else if (commandName === '8ball') {
    const question = options.getString('question');
    const answers = [
      "Yes.", 
      "No.", 
      "Maybe.", 
      "Definitely.", 
      "I don't think so.",
      "Ask again later.", 
      "Without a doubt.", 
      "Very unlikely.",
      "Absolutely!", 
      "Not sure, try again."
    ];
    const reply = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 The Magic 8-Ball Says...')
      .addFields(
        { name: 'Your question', value: question },
        { name: 'Answer', value: reply }
      )
      .setColor('#9b59b6')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
    else if (commandName === 'userinfo') {
      const user = options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Info`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Username', value: user.username, inline: true },
          { name: 'ID', value: user.id, inline: true },
          {
            name: 'Joined Server',
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: 'Account Created',
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          { name: 'Roles', value: member.roles.cache.map((r) => r.name).join(', ') || 'None' }
        )
        .setColor('#3498db');
      await interaction.reply({ embeds: [embed] });
    }
else if (commandName === 'hug') {
  const targetUser = options.getUser('user');
  const sender = interaction.user;

  await interaction.deferReply();

  const TENOR_API_KEY = 'AIzaSyCxp8PjYbCxssVNGsxLPXGrbKYyUhQQr1Y';
  const query = 'Lion Hugs';
  const apiURL = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=25&media_filter=gif`;

  try {
    const res = await fetch(apiURL);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return interaction.editReply('😢 Could not find a hug GIF right now.');
    }

    const gifUrl = data.results[Math.floor(Math.random() * data.results.length)].media_formats.gif.url;

    const embed = new EmbedBuilder()
      .setTitle('🤗 Hug!')
      .setDescription(`**${sender.username}** gives **${targetUser.username}** a big hug!`)
      .setImage(gifUrl)
      .setColor('#FFC0CB');

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error('Tenor fetch error:', err);
    await interaction.editReply('❌ Failed to fetch a hug GIF.');
  }
}

    else if (commandName === 'kick') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
      }
      if (!member.kickable) {
        return interaction.reply({ content: '❌ I cannot kick this user.', ephemeral: true });
      }

      const reason = options.getString('reason') || 'No reason provided';

      await member.kick(reason).catch((err) => {
        console.error(err);
        return interaction.reply({ content: '❌ Failed to kick user.', ephemeral: true });
      });

      await interaction.reply({ content: `✅ Kicked ${user.tag}` });
      await log(`**Kick:** ${user.tag}\n**Reason:** ${reason}`);
    }
    else if (commandName === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member && !member.bannable) {
        return interaction.reply({ content: '❌ I cannot ban this user.', ephemeral: true });
      }
      const reason = options.getString('reason') || 'No reason provided';

      await interaction.guild.members.ban(user.id, { reason }).catch((err) => {
        console.error(err);
        return interaction.reply({ content: '❌ Failed to ban user.', ephemeral: true });
      });

      await interaction.reply({ content: `✅ Banned ${user.tag}` });
      await log(`**Ban:** ${user.tag}\n**Reason:** ${reason}`);
    }
    else if (commandName === 'unban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const userId = options.getString('userid');
      try {
        await interaction.guild.members.unban(userId);
        await interaction.reply({ content: `✅ Unbanned user ID ${userId}` });
        await log(`**Unban:** User ID ${userId}`);
      } catch {
        await interaction.reply({ content: `❌ Failed to unban user ID ${userId}`, ephemeral: true });
      }
    }
    else if (commandName === 'mute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

      const muteRole = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted');
      if (!muteRole) return interaction.reply({ content: '❌ No "Muted" role found.', ephemeral: true });

      if (member.roles.cache.has(muteRole.id)) {
        return interaction.reply({ content: '❌ User is already muted.', ephemeral: true });
      }

      await member.roles.add(muteRole).catch(() => {});
      await interaction.reply({ content: `✅ Muted ${user.tag}` });
      await log(`**Mute:** ${user.tag}`);
      await user.send(`You have been muted.`)
    }
    else if (commandName === 'unmute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

      const muteRole = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted');
      if (!muteRole) return interaction.reply({ content: '❌ No "Muted" role found.', ephemeral: true });

      if (!member.roles.cache.has(muteRole.id)) {
        return interaction.reply({ content: '❌ User is not muted.', ephemeral: true });
      }

      await member.roles.remove(muteRole).catch(() => {});
      await interaction.reply({ content: `✅ Unmuted ${user.tag}` });
      await log(`**Unmute:** ${user.tag}`);
      await user.send(`You have been unmuted.`)
    }
    else if (commandName === 'warn') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const reason = options.getString('reason') || 'No reason provided';

      await interaction.reply({ content: `⚠️ Warned ${user.tag} for: ${reason}` });
      await user.send(`You have been warned for: ${reason}`)
      await log(`**Warn:** ${user.tag}\n**Reason:** ${reason}`);
    } 
    else if (commandName === 'purge') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const amount = options.getInteger('amount');
      if (amount < 1 || amount > 100)
        return interaction.reply({ content: '❌ Amount must be between 1 and 100.', ephemeral: true });
      await interaction.channel.bulkDelete(amount, true).catch(() => {});
      await interaction.reply({ content: `🧹 Deleted ${amount} messages.`, ephemeral: true });
    } 
    else if (commandName === 'roleadd') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const role = options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ content: '❌ User already has that role.', ephemeral: true });
      }

      await member.roles.add(role).catch(() => {});
      await interaction.reply({ content: `✅ Added role ${role.name} to ${user.tag}` });
      await user.send(`You have been given the role: ${role.name}`)
    }
else if (commandName === 'lion') {
  await interaction.deferReply();

  const PEXELS_API_KEY = 'als2pDRKCI2N6TDoPy46xjI1XbyE2jxZq33U2M4BiPJif4pWrtpYYAV2';
  const url = 'https://api.pexels.com/v1/search?query=lion+king+mufasa&per_page=10';

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return interaction.editReply('Sorry, could not find any Mufasa images right now.');
    }

    const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
    const imageUrl = randomPhoto.src.large;
    
    const embed = new EmbedBuilder()
      .setTitle('Mufasa - The Lion King')
      .setImage(imageUrl)
      .setColor('#FFD700')
      .setFooter({ text: 'Powered by Pexels API.' });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.editReply('Failed to fetch Mufasa images, please try again later.');
  }
}
    else if (commandName === 'cat') {
      await interaction.deferReply();
      try {
        const fetch = require('node-fetch')
        const response = await fetch('https://api.thecatapi.com/v1/images/search')
        const data = await response.json();
        if (!data || data.length === 0) {
          return interaction.editReply('Could not fetch a cat image right now, try again later.');
        }
        const catImageUrl = data[0].url;
        const embed = new EmbedBuilder()
        .setTitle('Random Cat')
        .setImage(catImageUrl)
        .setColor('#FFA07A')
        .setFooter({ text: 'Powered by TheCatAPI'});

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await interaction.editReply('Failed to fetch a cat image, please try again later.')
      }
    }
    else if (commandName === 'roleremove') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const user = options.getUser('user');
      const role = options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({ content: '❌ User does not have that role.', ephemeral: true });
      }

      await member.roles.remove(role).catch(() => {});
      await interaction.reply({ content: `✅ Removed role ${role.name} from ${user.tag}` });
      await user.send(`You have been removed from the role: ${role.name}`)
    } 
    else if (commandName === 'tickets') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }
      const channel = options.getChannel('channel');
      if (!channel.isTextBased())
        return interaction.reply({ content: '❌ Please select a text channel.', ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('openTicket')
          .setLabel('Open Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Click the button below to open a support ticket!')
        .setColor('#2f3136');

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket panel sent to ${channel}`, ephemeral: true });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'openTicket') {
      const existingChannel = interaction.guild.channels.cache.find(
        (ch) =>
          ch.name === `ticket-${interaction.user.username.toLowerCase()}` &&
          ch.parentId === config.categoryId
      );

      if (existingChannel) {
        return interaction.reply({
          content: `❌ You already have an open ticket: ${existingChannel}`,
          ephemeral: true,
        });
      }

      interaction.guild.channels
        .create({
          name: `ticket-${interaction.user.username}`,
          type: 0,
          parent: config.categoryId,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: ['ViewChannel'],
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
            {
              id: config.ticketRole,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
          ],
        })
        .then(async (channel) => {
          ticketInfo.set(interaction.user.id, channel.id);

          const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket Created')
            .setDescription(
              `Hello ${interaction.user}, a staff member will be with you shortly.\n` +
              'Use the button below to close this ticket when your issue is resolved.'
            )
            .setColor('#2f3136');

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('closeTicket')
              .setLabel('Close Ticket')
              .setStyle(ButtonStyle.Danger)
          );

          await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

          await interaction.reply({
            content: `✅ Your ticket has been created: ${channel}`,
            ephemeral: true,
          });
        })
        .catch((err) => {
          console.error(err);
          interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
        });
    }
    else if (interaction.customId === 'closeTicket') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      }

      await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });

      setTimeout(async () => {
        try {
          await channel.delete();
        } catch {}
      }, 5000);
    }
  }
});

client.login(process.env.TOKEN);
