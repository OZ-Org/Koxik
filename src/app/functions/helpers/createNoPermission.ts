import type { ReplyBuilder } from '@basedir/discord/client/bot/ReplyBuilder.js';
import { type LangKey, replyLang } from '@fx/utils/replyLang.js';
import {
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
} from 'discord.js';

interface PermissionsListType {
	bit: bigint;
	locales: {
		'pt-BR': string;
		'en-US': string;
		'es-ES': string;
	};
}

export const PermissionList: PermissionsListType[] = [
	{
		bit: PermissionFlagsBits.CreateInstantInvite,
		locales: {
			'pt-BR': 'Criar convite',
			'en-US': 'Create Instant Invite',
			'es-ES': 'Crear invitación',
		},
	},
	{
		bit: PermissionFlagsBits.KickMembers,
		locales: {
			'pt-BR': 'Expulsar membros',
			'en-US': 'Kick Members',
			'es-ES': 'Expulsar miembros',
		},
	},
	{
		bit: PermissionFlagsBits.BanMembers,
		locales: {
			'pt-BR': 'Banir membros',
			'en-US': 'Ban Members',
			'es-ES': 'Banear miembros',
		},
	},
	{
		bit: PermissionFlagsBits.Administrator,
		locales: {
			'pt-BR': 'Administrador',
			'en-US': 'Administrator',
			'es-ES': 'Administrador',
		},
	},
	{
		bit: PermissionFlagsBits.ManageChannels,
		locales: {
			'pt-BR': 'Gerenciar canais',
			'en-US': 'Manage Channels',
			'es-ES': 'Administrar canales',
		},
	},
	{
		bit: PermissionFlagsBits.ManageGuild,
		locales: {
			'pt-BR': 'Gerenciar servidor',
			'en-US': 'Manage Server',
			'es-ES': 'Administrar servidor',
		},
	},
	{
		bit: PermissionFlagsBits.AddReactions,
		locales: {
			'pt-BR': 'Adicionar reações',
			'en-US': 'Add Reactions',
			'es-ES': 'Agregar reacciones',
		},
	},
	{
		bit: PermissionFlagsBits.ViewAuditLog,
		locales: {
			'pt-BR': 'Ver log de auditoria',
			'en-US': 'View Audit Log',
			'es-ES': 'Ver registro de auditoría',
		},
	},
	{
		bit: PermissionFlagsBits.PrioritySpeaker,
		locales: {
			'pt-BR': 'Prioridade ao falar',
			'en-US': 'Priority Speaker',
			'es-ES': 'Prioridad para hablar',
		},
	},
	{
		bit: PermissionFlagsBits.ViewChannel,
		locales: {
			'pt-BR': 'Ver canais',
			'en-US': 'View Channel',
			'es-ES': 'Ver canal',
		},
	},
	{
		bit: PermissionFlagsBits.SendMessages,
		locales: {
			'pt-BR': 'Enviar mensagens',
			'en-US': 'Send Messages',
			'es-ES': 'Enviar mensajes',
		},
	},
	{
		bit: PermissionFlagsBits.SendTTSMessages,
		locales: {
			'pt-BR': 'Enviar mensagens TTS',
			'en-US': 'Send TTS Messages',
			'es-ES': 'Enviar mensajes TTS',
		},
	},
	{
		bit: PermissionFlagsBits.ManageMessages,
		locales: {
			'pt-BR': 'Gerenciar mensagens',
			'en-US': 'Manage Messages',
			'es-ES': 'Administrar mensajes',
		},
	},
	{
		bit: PermissionFlagsBits.EmbedLinks,
		locales: {
			'pt-BR': 'Inserir links',
			'en-US': 'Embed Links',
			'es-ES': 'Incrustar enlaces',
		},
	},
	{
		bit: PermissionFlagsBits.AttachFiles,
		locales: {
			'pt-BR': 'Anexar arquivos',
			'en-US': 'Attach Files',
			'es-ES': 'Adjuntar archivos',
		},
	},
	{
		bit: PermissionFlagsBits.ReadMessageHistory,
		locales: {
			'pt-BR': 'Ler histórico',
			'en-US': 'Read Message History',
			'es-ES': 'Leer historial de mensajes',
		},
	},
	{
		bit: PermissionFlagsBits.MentionEveryone,
		locales: {
			'pt-BR': 'Mencionar everyone',
			'en-US': 'Mention Everyone',
			'es-ES': 'Mencionar everyone',
		},
	},
	{
		bit: PermissionFlagsBits.UseExternalEmojis,
		locales: {
			'pt-BR': 'Usar emojis externos',
			'en-US': 'Use External Emojis',
			'es-ES': 'Usar emojis externos',
		},
	},
	{
		bit: PermissionFlagsBits.ViewGuildInsights,
		locales: {
			'pt-BR': 'Ver insights do servidor',
			'en-US': 'View Guild Insights',
			'es-ES': 'Ver insights del servidor',
		},
	},
	{
		bit: PermissionFlagsBits.UseVAD,
		locales: {
			'pt-BR': 'Usar detecção de voz',
			'en-US': 'Use VAD',
			'es-ES': 'Usar detección de voz',
		},
	},
	{
		bit: PermissionFlagsBits.ChangeNickname,
		locales: {
			'pt-BR': 'Mudar apelido',
			'en-US': 'Change Nickname',
			'es-ES': 'Cambiar apodo',
		},
	},
	{
		bit: PermissionFlagsBits.ManageNicknames,
		locales: {
			'pt-BR': 'Gerenciar apelidos',
			'en-US': 'Manage Nicknames',
			'es-ES': 'Administrar apodos',
		},
	},
	{
		bit: PermissionFlagsBits.ManageRoles,
		locales: {
			'pt-BR': 'Gerenciar cargos',
			'en-US': 'Manage Roles',
			'es-ES': 'Administrar roles',
		},
	},
	{
		bit: PermissionFlagsBits.ManageWebhooks,
		locales: {
			'pt-BR': 'Gerenciar webhooks',
			'en-US': 'Manage Webhooks',
			'es-ES': 'Administrar webhooks',
		},
	},
	{
		bit: PermissionFlagsBits.ManageEmojisAndStickers,
		locales: {
			'pt-BR': 'Gerenciar emojis e stickers',
			'en-US': 'Manage Emojis & Stickers',
			'es-ES': 'Administrar emojis y stickers',
		},
	},
	{
		bit: PermissionFlagsBits.UseApplicationCommands,
		locales: {
			'pt-BR': 'Usar comandos de app',
			'en-US': 'Use Application Commands',
			'es-ES': 'Usar comandos de app',
		},
	},
	{
		bit: PermissionFlagsBits.RequestToSpeak,
		locales: {
			'pt-BR': 'Pedido para falar',
			'en-US': 'Request to Speak',
			'es-ES': 'Solicitar hablar',
		},
	},
	{
		bit: PermissionFlagsBits.ManageThreads,
		locales: {
			'pt-BR': 'Gerenciar threads',
			'en-US': 'Manage Threads',
			'es-ES': 'Administrar threads',
		},
	},
	{
		bit: PermissionFlagsBits.CreatePublicThreads,
		locales: {
			'pt-BR': 'Criar threads públicas',
			'en-US': 'Create Public Threads',
			'es-ES': 'Crear threads públicas',
		},
	},
	{
		bit: PermissionFlagsBits.CreatePrivateThreads,
		locales: {
			'pt-BR': 'Criar threads privadas',
			'en-US': 'Create Private Threads',
			'es-ES': 'Crear threads privadas',
		},
	},
	{
		bit: PermissionFlagsBits.UseExternalStickers,
		locales: {
			'pt-BR': 'Usar stickers externos',
			'en-US': 'Use External Stickers',
			'es-ES': 'Usar stickers externos',
		},
	},
	{
		bit: PermissionFlagsBits.SendMessagesInThreads,
		locales: {
			'pt-BR': 'Enviar mensagens em threads',
			'en-US': 'Send Messages in Threads',
			'es-ES': 'Enviar mensajes en threads',
		},
	},
	{
		bit: PermissionFlagsBits.UseEmbeddedActivities,
		locales: {
			'pt-BR': 'Usar atividades incorporadas',
			'en-US': 'Use Embedded Activities',
			'es-ES': 'Usar actividades incrustadas',
		},
	},
	{
		bit: PermissionFlagsBits.ModerateMembers,
		locales: {
			'pt-BR': 'Moderar membros',
			'en-US': 'Moderate Members',
			'es-ES': 'Moderar miembros',
		},
	},
	{
		bit: PermissionFlagsBits.ViewCreatorMonetizationAnalytics,
		locales: {
			'pt-BR': 'Ver análises de monetização',
			'en-US': 'View Creator Monetization Analytics',
			'es-ES': 'Ver analíticas de monetización',
		},
	},
	{
		bit: PermissionFlagsBits.UseSoundboard,
		locales: {
			'pt-BR': 'Usar soundboard',
			'en-US': 'Use Soundboard',
			'es-ES': 'Usar soundboard',
		},
	},
	{
		bit: PermissionFlagsBits.CreateGuildExpressions,
		locales: {
			'pt-BR': 'Criar expressões do servidor',
			'en-US': 'Create Guild Expressions',
			'es-ES': 'Crear expresiones del servidor',
		},
	},
	{
		bit: PermissionFlagsBits.CreateEvents,
		locales: {
			'pt-BR': 'Criar eventos',
			'en-US': 'Create Events',
			'es-ES': 'Crear eventos',
		},
	},
	{
		bit: PermissionFlagsBits.UseExternalSounds,
		locales: {
			'pt-BR': 'Usar sons externos',
			'en-US': 'Use External Sounds',
			'es-ES': 'Usar sonidos externos',
		},
	},
	{
		bit: PermissionFlagsBits.SendVoiceMessages,
		locales: {
			'pt-BR': 'Enviar mensagens de voz',
			'en-US': 'Send Voice Messages',
			'es-ES': 'Enviar mensajes de voz',
		},
	},
	{
		bit: PermissionFlagsBits.SendPolls,
		locales: {
			'pt-BR': 'Enviar enquetes',
			'en-US': 'Send Polls',
			'es-ES': 'Enviar encuestas',
		},
	},
	{
		bit: PermissionFlagsBits.UseExternalApps,
		locales: {
			'pt-BR': 'Usar apps externos',
			'en-US': 'Use External Apps',
			'es-ES': 'Usar apps externos',
		},
	},
	{
		bit: PermissionFlagsBits.PinMessages,
		locales: {
			'pt-BR': 'Fixar mensagens',
			'en-US': 'Pin Messages',
			'es-ES': 'Fijar mensajes',
		},
	},
	{
		bit: PermissionFlagsBits.BypassSlowmode,
		locales: {
			'pt-BR': 'Ignorar slowmode',
			'en-US': 'Bypass Slowmode',
			'es-ES': 'Ignorar slowmode',
		},
	},
];

export function createMissingPermissionEmbed({
	interaction,
	res,
	permission,
	actionKey,
	target,
}: {
	interaction: ChatInputCommandInteraction;
	res: ReplyBuilder;
	permission: bigint;
	actionKey: LangKey;
	target: 'bot' | 'user';
}) {
	const locale =
		interaction.locale === 'pt-BR' || interaction.locale === 'es-ES'
			? interaction.locale
			: Locale.EnglishUS;

	const permissionData = PermissionList.find((p) => p.bit === permission);

	const permissionName =
		permissionData?.locales[locale] ??
		permissionData?.locales['en-US'] ??
		'Unknown permission';

	const action = replyLang(locale, actionKey);

	const title = replyLang(
		locale,
		`common#errors#missing_permission#${target}#title`,
		{ action },
	);

	const description = replyLang(
		locale,
		`common#errors#missing_permission#${target}#description`,
		{ permission: permissionName },
	);

	return res.ephemeral().crying(`${title}\n${description}`, locale);
}
