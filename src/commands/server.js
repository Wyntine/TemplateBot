const { PermissionsBitField, ChannelType, CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("şablon")
    .setDescription("Bir sunucunun şablonunu kurarsın!")
    .addStringOption((option) =>
      option.setName("id").setDescription("Sunucunun ID nedir?").setRequired(true)
    ),
  /**
   * @param {Client<true>} client
   * @param {CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const guild = interaction.guild;

    if (!guild) return interaction.reply("Bu komutu sunucuda çalıştırmalısınız.");

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply("Yeterli yetkin bulunmamakta!");

    const serverId = interaction.options.getString("id");
    const server = client.guilds.cache.get(serverId);

    if (!server)
      return interaction.reply("Böyle bir sunucu bulunamadı veya belirtilen sunucuda yokum.");

    const newChannels = server.channels.cache.map((channel) => channel);
    const oldChannels = guild.channels.cache.map((channel) => channel);

    const firstMap = [...newChannels]
      .filter((channel) => !channel.parentId)
      .sort((first, second) => first.rawPosition - second.rawPosition);
    const secondMap = [...newChannels].filter((channel) => channel.parentId);

    /** @type {Map<string, string>} */
    const newCategory = new Map();

    try {
      await interaction.reply("Eski kanallar siliniyor ve yeni kanallar kuruluyor...");
      for (const channel of oldChannels) {
        await channel.delete();
      }
      for (const channel of firstMap) {
        const newChannel = await guild.channels.create({ name: channel.name, type: channel.type });

        if (channel.type === ChannelType.GuildCategory) newCategory.set(channel.id, newChannel.id);
      }
      for (const [oldChannel] of newCategory) {
        const channelParent = newCategory.get(oldChannel);
        const categoryChannels = [...secondMap]
          .filter((channel) => channel.parentId === oldChannel)
          .sort((first, second) => first.position - second.position);
        for (const channel of categoryChannels) {
          /** @type {import("discord.js").GuildChannelCreateOptions} */
          const channelOptions = {
            name: channel.name,
            type: channel.type,
            parent: channelParent,
            ...(channel.isVoiceBased()
              ? {
                  bitrate: channel.bitrate,
                  rtcRegion: channel.rtcRegion,
                  userLimit: channel.userLimit,
                  videoQualityMode: channel.videoQualityMode,
                  bitrate: channel.bitrate,
                }
              : {
                  topic: channel.topic,
                  nsfw: channel.nsfw,
                }),
          };
          await guild.channels.create(channelOptions);
        }
      }
    } catch (error) {
      console.error(error);
      await interaction.followUp("Bir hata oluştu!").catch((error) => console.error(error));
    }
  },
};
