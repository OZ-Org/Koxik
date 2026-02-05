const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../models/user'); // Importa o modelo User do banco de dados

// Definindo os itens da loja com suas propriedades
const shopItems = {
    pickaxes: [
        {
            name: 'Picareta de Madeira',
            emoji: '🪓',
            price: 100,
            description: 'Picareta básica de madeira',
            pickaxeType: 'wooden',
            applyToUser: (user) => {
                user.pickaxe = 'wooden';
                user.durability = 100;
            }
        },
        {
            name: 'Picareta de Pedra',
            emoji: '⛏️',
            price: 200,
            description: 'Picareta de pedra resistente',
            pickaxeType: 'stone',
            applyToUser: (user) => {
                user.pickaxe = 'stone';
                user.durability = 300;
            }
        },
        {
            name: 'Picareta de Ferro',
            emoji: '🔨',
            price: 500,
            description: 'Picareta de ferro forte',
            pickaxeType: 'iron',
            applyToUser: (user) => {
                user.pickaxe = 'iron';
                user.durability = 500;
            }
        },
        {
            name: 'Picareta de Diamante',
            emoji: '💎',
            price: 1000,
            description: 'Picareta de diamante super forte',
            pickaxeType: 'diamond',
            applyToUser: (user) => {
                user.pickaxe = 'diamond';
                user.durability = 800;
            }
        },
        {
            name: 'Picareta de Netherite',
            emoji: '🔥',
            price: 2000,
            description: 'Picareta de netherite indestrutível',
            pickaxeType: 'netherite',
            applyToUser: (user) => {
                user.pickaxe = 'netherite';
                user.durability = 1000;
            }
        },
    ],
};

// Definindo as categorias da loja com suas propriedades
const categorias = [
    {
        name: 'Picaretas',
        emoji: '⛏',
        style: ButtonStyle.Success,
        color: 'Blue',
        description: 'Loja de picaretas para usar no comando /minerar',
        items: shopItems.pickaxes
    }
];

// Exportando o comando da loja
module.exports = {
    data: new SlashCommandBuilder()
        .setName('loja') // Nome do comando
        .setDescription('Abra a loja para comprar itens.'), // Descrição do comando
    async execute(interaction) { // Função executada quando o comando é chamado
        const userId = interaction.user.id; // Obtém o ID do usuário que chamou o comando

        // Busca o usuário no banco de dados
        let user = await User.findOne({ discordId: userId });

        // Se o usuário não existir, cria um novo
        if (!user) {
            user = new User({ discordId: userId, username: interaction.user.username, balance: 0, pickaxe: null });
            await user.save(); // Salva o novo usuário no banco de dados
        }

        // Cria um embed principal para a loja
        const mainEmbed = new EmbedBuilder()
            .setTitle('Loja') // Título do embed
            .setDescription('Escolha uma categoria para ver os itens disponíveis.') // Descrição do embed
            .setColor('#00FF00'); // Cor do embed

        // Cria botões para cada categoria
        const categoryButtons = categorias.map(cat => {
            return new ButtonBuilder()
                .setCustomId(`category_${cat.name}`) // Define um ID único para o botão
                .setLabel(cat.name) // Texto do botão
                .setEmoji(cat.emoji) // Emoji do botão
                .setStyle(cat.style); // Estilo do botão
        });

        // Adiciona os botões a uma linha de ação
        const categoryRow = new ActionRowBuilder().addComponents(categoryButtons);

        // Envia a resposta inicial com o embed e os botões de categorias
        await interaction.reply({ embeds: [mainEmbed], components: [categoryRow] });

        // Define um filtro para o coletor de componentes, para garantir que apenas o usuário que chamou o comando possa interagir
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        // Evento disparado quando um botão é clicado
        collector.on('collect', async i => {
            if (i.customId.startsWith('category_')) { // Verifica se o botão clicado é de uma categoria
                const category = categorias.find(cat => `category_${cat.name}` === i.customId); // Encontra a categoria correspondente
                if (category) {
                    // Cria um embed para a categoria
                    const categoryEmbed = new EmbedBuilder()
                        .setTitle(category.name) // Título do embed da categoria
                        .setDescription(category.description) // Descrição do embed da categoria
                        .setColor(category.color); // Cor do embed da categoria

                    // Cria botões para cada item da categoria
                    const itemButtons = category.items.map(item => {
                        return new ButtonBuilder()
                            .setCustomId(`buy_${item.pickaxeType}`) // Define um ID único para o botão
                            .setLabel(`${item.name} - ${item.price} coins`) // Texto do botão
                            .setEmoji(item.emoji) // Emoji do botão
                            .setStyle(ButtonStyle.Primary); // Estilo do botão
                    });

                    // Adiciona os botões a uma linha de ação
                    const itemRows = new ActionRowBuilder().addComponents(itemButtons);

                    // Atualiza a mensagem original com o embed da categoria e os botões de itens
                    await i.update({ embeds: [categoryEmbed], components: [itemRows] });
                }
            }

            if (i.customId.startsWith('buy_')) { // Verifica se o botão clicado é de compra de item
                const selectedItemType = i.customId.split('_')[1]; // Obtém o tipo do item selecionado a partir do ID do botão
                const selectedItem = categorias.flatMap(cat => cat.items).find(item => item.pickaxeType === selectedItemType); // Encontra o item correspondente

                if (user.balance >= selectedItem.price) { // Verifica se o usuário tem saldo suficiente
                    user.balance -= selectedItem.price; // Deduz o preço do item do saldo do usuário

                    // Executa a função definida no item
                    selectedItem.applyToUser(user);
                    await user.save(); // Salva as alterações no banco de dados

                    // Responde ao usuário informando que a compra foi bem-sucedida
                    await i.reply({ content: `Você comprou a ${selectedItem.name} por ${selectedItem.price} coins!`, ephemeral: true });
                } else {
                    // Responde ao usuário informando que ele não tem saldo suficiente
                    await i.reply({ content: 'Você não tem saldo suficiente para comprar este item.', ephemeral: true });
                }
            }
        });

        // Evento disparado quando o tempo do coletor expira
        collector.on('end', collected => {
            if (collected.size === 0) { // Verifica se nenhum botão foi clicado
                interaction.followUp({ content: 'Tempo limite atingido. Tente novamente.', ephemeral: true }); // Informa ao usuário que o tempo expirou
            }
        });
    },
};
