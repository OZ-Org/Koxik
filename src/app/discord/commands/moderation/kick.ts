import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	Colors,
	type GuildMember,
	type Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import {
	createConfirmationEmbed,
	createErrorEmbed,
	createSuccessEmbed,
} from '../utils.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server.')
		.setDescriptionLocalizations({
			'pt-BR': 'Expulse um membro do servidor.',
			'es-ES': 'Expulsa a un miembro del servidor.',
		})
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption((opt) =>
			opt
				.setName('member')
				.setNameLocalizations({
					'pt-BR': 'membro',
					'es-ES': 'miembro',
				})
				.setDescription('The member to kick.')
				.setDescriptionLocalizations({
					'pt-BR': 'O membro a ser expulso.',
					'es-ES': 'El miembro a expulsar.',
				})
				.setRequired(true),
		),

	run: async ({ client, interaction }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_no_guild'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		const targetUser = interaction.options.getUser('member', true);
		const targetMember = await interaction.guild.members
			.fetch(targetUser.id)
			.catch(() => null);

		if (!targetMember) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_member_not_found', {
					user: targetUser.tag,
				}),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		if (targetUser.id === interaction.user.id) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_cannot_kick_self'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		if (targetUser.id === interaction.guild.ownerId) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_cannot_kick_owner', {
					suspect: emotes.misc.suspect,
				}),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		const me =
			interaction.guild.members.cache.get(client.solid.user.id) ??
			(await interaction.guild.members.fetch(client.solid.user.id));
		const executor = interaction.member as GuildMember;

		if (me.roles.highest.position <= targetMember.roles.highest.position) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_bot_higher_role'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		if (
			(executor as GuildMember).roles.highest.position <=
			targetMember.roles.highest.position &&
			interaction.guild.ownerId !== (executor as GuildMember).id
		) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'kick#responses#error_higher_role'),
			);
			return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
		}

		const confirmId = 'kick_confirm';
		const cancelId = 'kick_cancel';

		const confirmButton = new ButtonBuilder()
			.setCustomId(confirmId)
			.setLabel(t(locale, 'kick#responses#confirm_button'))
			.setStyle(ButtonStyle.Danger)
			.setEmoji(emotes.utils.checkmark || '✅');

		const cancelButton = new ButtonBuilder()
			.setCustomId(cancelId)
			.setLabel(t(locale, 'kick#responses#cancel_button'))
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(emotes.utils.crossmark || '❌');

		const row = createRow(confirmButton, cancelButton);

		const confirmEmbed = createConfirmationEmbed(locale, {
			title: 'Kick Confirmation',
			description: t(locale, 'kick#responses#confirm_prompt', {
				user: `${targetUser}`,
			}),
			user: interaction.user,
			targetUser: targetUser,
		});

		await interaction.reply({
			embeds: [confirmEmbed],
			components: [row],
			flags: ['Ephemeral'],
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
				const cancelEmbed = createErrorEmbed(
					locale,
					'Cancelled',
					`${t(locale, 'kick#responses#cancelled', {
						user: `${targetUser.tag}`,
					})} :3`,
				).setColor(Colors.Orange);

				await interaction.editReply({
					embeds: [cancelEmbed],
					components: [],
				});
				return;
			}

			if (i.customId === confirmId) {
				handled = true;
				collector.stop('confirmed');

				try {
					const reason = t(locale, 'kick#responses#reason_template', {
						moderator: interaction.user.tag,
					});

					await interaction.guild?.members.kick(targetUser.id, reason);

					const successEmbed = createSuccessEmbed(
						'Success',
						`${t(locale, 'kick#responses#success', {
							user: `${targetUser.tag}`,
						})} ${emotes.misc.boot} :3`,
					);

					await interaction.editReply({
						embeds: [successEmbed],
						components: [],
					});
				} catch (err) {
					console.error('Kick error:', err);
					const errorEmbed = createErrorEmbed(
						locale,
						'Error',
						t(locale, 'kick#responses#error_on_kick'),
					);
					await interaction.editReply({
						embeds: [errorEmbed],
						components: [],
					});
				}
			}
		});

		collector.on('end', async () => {
			if (handled) return;

			const timeoutEmbed = createErrorEmbed(
				locale,
				'Timeout',
				t(locale, 'kick#responses#timeout'),
			).setColor(Colors.Orange);

			await interaction.editReply({
				embeds: [timeoutEmbed],
				components: [],
			});
		});
	},
});
