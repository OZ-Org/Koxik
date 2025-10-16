import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import {
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type GuildMember,
	type Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import { createRow } from "@magicyan/discord"
import { emotes } from 'misc/emotes.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription(
			'Drop the hammer and ban someone forever from your server :3',
		)
		.setDescriptionLocalizations({
			'pt-BR': 'Bata o martelo e bana pra sempre alguém do seu servidor :3',
			'es-ES':
				'Da el martillo y banea a alguien para siempre de tu servidor :3',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption((opt) =>
			opt
				.setName('member')
				.setNameLocalizations({
					'pt-BR': 'membro',
					'es-ES': 'miembro',
				})
				.setDescription("Who's getting obliterated today? :3")
				.setDescriptionLocalizations({
					'pt-BR': 'Qual será o morto da vez? :3',
					'es-ES': '¿Quién será el desafortunado hoy? :3',
				})
				.setRequired(true),
		),

	run: async (client, interaction) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_no_guild'),
				ephemeral: true,
			});
		}

		const targetUser = interaction.options.getUser('member', true);
		const targetMember = await interaction.guild.members
			.fetch(targetUser.id)
			.catch(() => null);

		if (!targetMember) {
			return interaction.reply({

			})
		}

		if (targetUser.id === interaction.user.id) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_cannot_ban_self'),
				ephemeral: true,
			});
		}

		if (targetUser.id === interaction.guild.ownerId) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_cannot_ban_owner', {
					suspect: emotes.misc.suspect,
				}),
				ephemeral: true,
			});
		}

		if (!targetMember) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_member_not_found', {
					user: targetUser.tag,
				}),
				ephemeral: true,
			});
		}

		const me =
			interaction.guild.members.cache.get(client.solid.user.id) ??
			(await interaction.guild.members.fetch(client.solid.user.id));
		const executor = interaction.member as GuildMember;

		if (me.roles.highest.position <= targetMember.roles.highest.position) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_bot_higher_role'),
				ephemeral: true,
			});
		}

		if (
			(executor as GuildMember).roles.highest.position <=
			targetMember.roles.highest.position &&
			interaction.guild.ownerId !== (executor as GuildMember).id
		) {
			return interaction.reply({
				content: t(locale, 'ban#responses#error_higher_role'),
				ephemeral: true,
			});
		}

		const confirmId = 'ban_confirm';
		const cancelId = 'ban_cancel';

		const confirmButton = new ButtonBuilder()
			.setCustomId(confirmId)
			.setLabel(t(locale, 'ban#responses#confirm_button'))
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new ButtonBuilder()
			.setCustomId(cancelId)
			.setLabel(t(locale, 'ban#responses#cancel_button'))
			.setStyle(ButtonStyle.Secondary);

		const row = createRow(
			confirmButton,
			cancelButton,
		);

		await interaction.reply({
			content: t(locale, 'ban#responses#confirm_prompt', {
				user: `${targetUser.tag}`,
			}),
			components: [row],
			ephemeral: true,
		});

		const message = await interaction.fetchReply();

		const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		const collector = (message as any).createMessageComponentCollector({
			filter,
			time: 30_000,
		});

		let handled = false;

		collector.on('collect', async (i: ButtonInteraction) => {
			await i.deferUpdate();

			if (i.customId === cancelId) {
				handled = true;
				collector.stop('cancelled');
				await interaction.editReply({
					content:
						`${t(locale, 'ban#responses#cancelled', {
							user: `${targetUser.tag}`,
						})} :3`,
					components: [],
				});
				return;
			}

			if (i.customId === confirmId) {
				handled = true;
				collector.stop('confirmed');

				try {
					const reason = t(locale, 'ban#responses#reason_template', {
						moderator: interaction.user.tag,
					});

					await interaction.guild?.members.ban(targetUser.id, { reason });

					await interaction.editReply({
						content:
							`${t(locale, 'ban#responses#success', {
								user: `${targetUser.tag}`,
							})} 💥 :3`,
						components: [],
					});
				} catch (err) {
					console.error('Ban error:', err);
					await interaction.editReply({
						content: t(locale, 'ban#responses#error_on_ban'),
						components: [],
					});
				}
			}
		});

		collector.on('end', async () => {
			if (handled) return;

			await interaction.editReply({
				content: t(locale, 'ban#responses#timeout'),
				components: [],
			});
		});
	},
});
