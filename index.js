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
  ButtonStyle
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const ticketInfo = new Map();

const config = {
  ticketRole: '1369334028544639017',
  categoryId: '1369016919058940088',
};

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Ban a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder().setName('mute').setDescription('Mute a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('unmute').setDescription('Unmute a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('warn').setDescription('Warn a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('purge').setDescription('Delete messages.')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages').setRequired(true)),
  new SlashCommandBuilder().setName('tickets').setDescription('Sends tickets.')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The channel to create tickets in')
        .addChannelTypes(0)
        .setRequired(true)
    )
];

client.once('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
    body: commands.map(cmd => cmd.toJSON())
  });
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
    const log = async (description) => {
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🛠️ Moderation Action')
          .setDescription(description)
          .setColor('#e74c3c')
          .setTimestamp()
          .setFooter({ text: `Moderator: ${interaction.user.tag}` });
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    };

    if (commandName === 'ban') {
      const user = options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
      await member.ban({ reason: `Banned by ${interaction.user.tag}` });
      await interaction.reply(`✅ Banned ${user.tag}`);
      log(`🔨 **${user.tag}** was **banned** by ${interaction.user.tag}`);
    } else if (commandName === 'kick') {
      const user = options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
      await member.kick(`Kicked by ${interaction.user.tag}`);
      await interaction.reply(`👢 Kicked ${user.tag}`);
      log(`👢 **${user.tag}** was **kicked** by ${interaction.user.tag}`);
    } else if (commandName === 'mute') {
      const user = options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
      await member.timeout(60_000 * 10);
      await interaction.reply(`🔇 Muted ${user.tag} for 10 minutes`);
      log(`🔇 **${user.tag}** was **muted for 10 minutes** by ${interaction.user.tag}`);
    } else if (commandName === 'unmute') {
      const user = options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
      await member.timeout(null);
      await interaction.reply(`🔊 Unmuted ${user.tag}`);
      log(`🔊 **${user.tag}** was **unmuted** by ${interaction.user.tag}`);
    } else if (commandName === 'warn') {
      const user = options.getUser('user');
      const reason = options.getString('reason') || 'No reason';
      await interaction.reply(`⚠️ Warned ${user.tag} for: ${reason}`);
      try {
        await user.send(`⚠️ You were warned in **${interaction.guild.name}**: ${reason}`);
      } catch {}
      log(`⚠️ **${user.tag}** was **warned** by ${interaction.user.tag}\n**Reason:** ${reason}`);
    } else if (commandName === 'purge') {
      const amount = options.getInteger('amount');
      if (amount > 100) return interaction.reply({ content: 'Max 100 messages.', ephemeral: true });
      await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `🧹 Deleted ${amount} messages.`, ephemeral: true });
      log(`🧹 **${amount} messages** were **purged** by ${interaction.user.tag} in <#${interaction.channel.id}>`);

      const embed = new EmbedBuilder()
        .setTitle('Hotrotka’s Capes Support')
        .setDescription("Welcome to this support panel!\n\nClick on the button below if you wish to make a cape ticket. They will respond to your request.")
        .setColor('#1ABC9C')
        .setFooter({ text: '🎟️ Hotrotka’s Capes' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Open Ticket')
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `Ticket panel sent to ${channel}`, ephemeral: true });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const ticketName = `ticket-${interaction.user.username.toLowerCase()}`;
      if (interaction.guild.channels.cache.find(c => c.name === ticketName))
        return interaction.reply({ content: 'You already have a ticket open.', ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: ticketName,
        parent: config.categoryId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: config.ticketRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle('📩 New Ticket')
        .setDescription('Support will assist you shortly. Use the buttons below.')
        .setColor('Green');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    } else if (interaction.customId === 'claim_ticket') {
      if (!interaction.member.roles.cache.has(config.ticketRole)) {
        interaction.reply({ content: '❌ You are not allowed to claim tickets.', ephemeral: true });
        return interaction.user.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('🚫 You cannot claim tickets')
              .setDescription('You do not have the required role.')
              .setColor('Red')
          ]
        }).catch(() => {});
      }

      const claimedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFooter({ text: `Claimed by ${interaction.user.tag}` })
        .setColor('Yellow');

      const originalRow = interaction.message.components[0];
      const updatedRow = ActionRowBuilder.from(originalRow).setComponents(
        originalRow.components.map(component =>
          ButtonBuilder.from(component).setDisabled(component.customId === 'claim_ticket')
        )
      );

      await interaction.update({
        embeds: [claimedEmbed],
        components: [updatedRow]
      });
    } else if (interaction.customId === 'close_ticket') {
      const channel = interaction.channel;

      const messages = await channel.messages.fetch({ limit: 10000 });
      const uniqueUsers = new Set(messages.map(msg => msg.author.tag));

      const ticketCreatorMatch = channel.name.match(/^ticket-(.+)/i);
      const ticketCreatorTag = ticketCreatorMatch ? ticketCreatorMatch[1] : 'Unknown';

      const createdAt = channel.createdAt; const closedAt = new Date();
      const duration = Math.round((closedAt - createdAt) / 1000);
      const durationFormatted = `${Math.floor(duration / 60)}m ${duration % 60}s`;

      const claimEmbedFooter = interaction.message.embeds[0]?.footer?.text || '';
      const claimedBy = claimEmbedFooter.startsWith('Claimed by') ? claimEmbedFooter.replace('Claimed by ', '') : 'Not claimed';

      const logChannel = interaction.guild.channels.cache.get(1369330280426373344);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
        .setTitle('🎟️ Ticket Closed')
        .setColor('Red')
        .addFields( 
          { name: 'Ticket Name', value: channel.name, inline: true },
          { name: 'Opened By', value: ticketCreatorTag, inline: true },
          { name: 'Claimed By', value: claimedBy, inline: true },
          { name: 'Closed By', value: interaction.user.tag, inline: true },
          { name: 'Duration', value: durationFormatted, inline: true },
          { name: 'Users Who Spoke', value: Array.from(uniqueUsers).join(', ').slice(0, 1024) || 'None' }
        )
        .setTimestamp();
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
          }
          
          await interaction.reply({ content: '✅ Closing this ticket in 5 seconds...', ephemeral: true });
          setTimeout(() => {
            channel.delete().catch(() => {});
          }, 5000);
        }
      }
    });

client.login(process.env.TOKEN);
