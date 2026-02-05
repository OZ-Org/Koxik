const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Ver Json da embed')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        try {
            // Verificar se o usuário tem a permissão necessária
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
            }

            // Obter a mensagem alvo
            const targetMessage = await interaction.channel.messages.fetch(interaction.targetId);

            // Verificar se a mensagem possui embeds
            if (!targetMessage.embeds.length) {
                return await interaction.reply({ content: 'A mensagem selecionada não contém nenhuma embed.', ephemeral: true });
            }

            // Obter o JSON da primeira embed
            const embedJson = targetMessage.embeds[0].toJSON();

            // Enviar o JSON da embed
            await interaction.reply({ content: `\`\`\`json\n${JSON.stringify(embedJson, null, 2)}\n\`\`\``, ephemeral: true });

        } catch (error) {
            console.error('Erro ao executar o comando de contexto "Ver Json da embed":', error);
            await interaction.reply({ content: 'Houve um erro ao executar este comando.', ephemeral: true });
        }
    },
};
