import { emotes, images } from '@misc/emotes.js';
import {
	type APIMessageTopLevelComponent,
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type ChatInputCommandInteraction,
	type JSONEncodable,
	MessageFlags,
	type ModalSubmitInteraction,
	type StringSelectMenuInteraction,
} from 'discord.js';
import type { ReplyPayload } from './types.js';

type V2Encodable =
	| JSONEncodable<APIMessageTopLevelComponent>
	| APIMessageTopLevelComponent;

export type SupportedInteraction =
	| ChatInputCommandInteraction
	| ButtonInteraction
	| StringSelectMenuInteraction
	| ChannelSelectMenuInteraction
	| ModalSubmitInteraction;

export class ReplyBuilder {
	constructor(
		private interaction: SupportedInteraction,
		private ephemeralMode = false,
		private updateMode = false,
	) {}

	private async dispatch(payload: ReplyPayload) {
		const flags = [
			...(Array.isArray(payload.flags) ? payload.flags : []),
			...(this.ephemeralMode ? [MessageFlags.Ephemeral] : []),
		] as const;

		const data = {
			...payload,
			flags: flags.length ? flags : undefined,
		};

		if (this.interaction.replied || this.interaction.deferred) {
			return this.interaction.editReply(data);
		}

		if (
			this.updateMode &&
			(this.interaction.isButton() ||
				this.interaction.isStringSelectMenu() ||
				this.interaction.isChannelSelectMenu())
		) {
			return this.interaction.update(data);
		}

		return this.interaction.reply(data);
	}

	async defer() {
		if (!this.interaction.replied && !this.interaction.deferred) {
			await this.interaction.deferReply({
				flags: this.ephemeralMode ? [MessageFlags.Ephemeral] : undefined,
			});
		}
		return this;
	}

	ephemeral() {
		return new ReplyBuilder(this.interaction, true, this.updateMode);
	}

	update() {
		return new ReplyBuilder(this.interaction, this.ephemeralMode, true);
	}

	success(content: string) {
		return this.dispatch({
			content: `${emotes.utils.checkmark} | ${content}`,
		});
	}

	crying(content: string, locale: string) {
		return this.dispatch({
			embeds: [
				{
					title: `${emotes.utils.crossmark} | ${
						locale === 'pt-BR'
							? 'Algo deu errado...'
							: locale === 'es-ES'
								? 'Algo salió mal...'
								: 'Something went wrong...'
					}`,
					description: content,
					thumbnail: { url: images.koxik.cry },
					color: 0xed4245,
				},
			],
		});
	}

	error(content: string) {
		return this.dispatch({
			content: `${emotes.utils.crossmark} | ${content}`,
		});
	}

	info(content: string) {
		return this.dispatch({
			content: `${emotes.utils.info} | ${content}`,
		});
	}

	normal(content: string) {
		return this.dispatch({ content });
	}

	raw(payload: ReplyPayload) {
		return this.dispatch(payload);
	}

	followUp(payload: ReplyPayload) {
		return this.interaction.followUp({
			...payload,
			flags: this.ephemeralMode ? [MessageFlags.Ephemeral] : payload.flags,
		});
	}

	v2(components: V2Encodable[], payload?: ReplyPayload) {
		return this.dispatch({
			...payload,
			flags: [MessageFlags.IsComponentsV2],
			components,
		});
	}
}
