import { createCommand } from '@base';
import { createMissingPermissionEmbed } from '@fx/helpers/createNoPermission.js';
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

	run: async ({ client, interaction, res }) => {
		const locale: Locale = interaction.locale;
		const t = replyLang;

		if (!interaction.guild) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_no_guild'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const targetUser = interaction.options.getUser('member', true);
		const targetMember = await interaction.guild.members
			.fetch(targetUser.id)
			.catch(() => null);

		if (!targetMember) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_member_not_found', {
					user: targetUser.tag,
				}),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		if (targetUser.id === interaction.user.id) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_cannot_ban_self'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		if (targetUser.id === interaction.guild.ownerId) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_cannot_ban_owner', {
					suspect: emotes.misc.suspect,
				}),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const me =
			interaction.guild.members.cache.get(client.solid.user.id) ??
			(await interaction.guild.members.fetch(client.solid.user.id));
		const executor = interaction.member as GuildMember;

		if (me.roles.highest.position <= targetMember.roles.highest.position) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_bot_higher_role'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		if (!me.permissions.has(PermissionFlagsBits.BanMembers)) {
			return await createMissingPermissionEmbed({
				interaction,
				res,
				permission: PermissionFlagsBits.BanMembers,
				actionKey: 'ban#responses#action',
				target: 'bot',
			});
		}

		if (
			!(executor as GuildMember).permissions.has(PermissionFlagsBits.BanMembers)
		) {
			return await createMissingPermissionEmbed({
				interaction,
				res,
				permission: PermissionFlagsBits.BanMembers,
				actionKey: 'ban#responses#action',
				target: 'user',
			});
		}

		if (
			(executor as GuildMember).roles.highest.position <=
				targetMember.roles.highest.position &&
			interaction.guild.ownerId !== (executor as GuildMember).id
		) {
			const embed = createErrorEmbed(
				locale,
				'Error',
				t(locale, 'ban#responses#error_higher_role'),
			);
			return res.ephemeral().raw({ embeds: [embed] });
		}

		const confirmId = 'ban/confirm';
		const cancelId = 'ban/cancel';

		const confirmButton = new ButtonBuilder()
			.setCustomId(confirmId)
			.setLabel(t(locale, 'ban#responses#confirm_button'))
			.setStyle(ButtonStyle.Danger)
			.setEmoji(emotes.utils.checkmark || '✅');

		const cancelButton = new ButtonBuilder()
			.setCustomId(cancelId)
			.setLabel(t(locale, 'ban#responses#cancel_button'))
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(emotes.utils.crossmark || '❌');

		const row = createRow(confirmButton, cancelButton);

		const confirmEmbed = createConfirmationEmbed(locale, {
			title: 'Ban Confirmation',
			description: t(locale, 'ban#responses#confirm_prompt', {
				user: `${targetUser}`,
			}),
			user: interaction.user,
			targetUser: targetUser,
		});

		res.ephemeral().raw({
			embeds: [confirmEmbed],
			components: [row],
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
					`${t(locale, 'ban#responses#cancelled', {
						user: `${targetUser.tag}`,
					})} :3`,
				).setColor(Colors.Orange);

				await res.raw({
					embeds: [cancelEmbed],
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

					const successEmbed = createSuccessEmbed(
						'Success',
						`${t(locale, 'ban#responses#success', {
							user: `${targetUser.tag}`,
						})} ${emotes.misc.boom} :3`,
					);

					await res.raw({
						embeds: [successEmbed],
						components: [],
					});
				} catch (err) {
					console.error('Ban error:', err);
					const errorEmbed = createErrorEmbed(
						locale,
						'Error',
						t(locale, 'ban#responses#error_on_ban'),
					);
					await res.raw({
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
				t(locale, 'ban#responses#timeout'),
			).setColor(Colors.Orange);

			await res.raw({
				embeds: [timeoutEmbed],
				components: [],
			});
		});
	},
});
