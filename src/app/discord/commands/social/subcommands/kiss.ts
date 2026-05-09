import { createSubCommand } from "@base";
import { ApplicationCommandOptionType, ButtonBuilder, ButtonStyle } from "discord.js";
import { replyLang } from "@app/functions/utils/replyLang.js";
import { createContainer, createMediaGallery, createRow } from "@magicyan/discord";
import { getGifWithCustomId } from "@misc/gifs.js";

const KissSubCommand = createSubCommand({
    name: "kiss",
    name_localizations: {
        "pt-BR": "beijar",
        "es-ES": "besar",
    },

    description: "Kiss someone.",
    description_localizations: {
        "pt-BR": "Beije alguém.",
        "es-ES": "Besa a alguien.",
    },

    options: [
        {
            name: "user",
            name_localizations: {
                "pt-BR": "usuário",
                "es-ES": "usuario",
            },

            description: "User to kiss.",
            description_localizations: {
                "pt-BR": "Usuário para beijar.",
                "es-ES": "Usuario para besar.",
            },

            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],

    run: async ({ interaction, res }) => {
        const target = interaction.options.getUser("user", true);

        const gif = getGifWithCustomId("kiss");

        const sourceButton = createRow([
            new ButtonBuilder()
                .setCustomId(gif.customId)
                .setLabel(replyLang(interaction.locale, "common#buttons#source"))
                .setEmoji("🖼️")
                .setStyle(ButtonStyle.Secondary)
        ]);

        if (target.id === interaction.user.id) {
            return res.v2([
                createContainer("#CD1C18", [
                    replyLang(interaction.locale, "kiss#self"),
                    createMediaGallery(gif.gif.url),
                    sourceButton
                ])
            ])
        }

        if (target.id === interaction.client.user.id) {
            return res.v2([
                createContainer("#CD1C18", [
                    replyLang(interaction.locale, "kiss#bot"),
                    createMediaGallery(gif.gif.url),
                    sourceButton
                ])
            ])
        }

        return res.v2([
            createContainer("#CD1C18", [
                replyLang(interaction.locale, "kiss#success", {
                    "user": interaction.user.toString(),
                    "target": target.toString()
                }),
                createMediaGallery(gif.gif.url),
                sourceButton
            ])
        ])
    },
});

export { KissSubCommand };