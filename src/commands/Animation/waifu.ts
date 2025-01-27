import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { getImageUrl } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import { Message, MessageEmbed } from 'discord.js';

/**
 * Faces were generated with
 * - 𝜓=0.8 for images #0–50,000 (medium quality/medium diversity).
 * - 𝜓=0.6 for #50,001–75,000 (high quality, low diversity).
 * - 𝜓=1.1 for #75,001–100,000 (low quality, high diversity) for a mix of good & interesting faces.
 */
const kMaximum = 100000;

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Animation.WaifuDescription,
	detailedDescription: LanguageKeys.Commands.Animation.WaifuExtended,
	requiredClientPermissions: [PermissionFlagsBits.EmbedLinks]
})
export class UserCommand extends SkyraCommand {
	public async messageRun(message: Message, args: SkyraCommand.Args) {
		const url = `https://thiswaifudoesnotexist.net/example-${Math.floor(Math.random() * kMaximum)}.jpg`;
		const embed = new MessageEmbed()
			.setTitle('→')
			.setURL(url)
			.setColor(await this.container.db.fetchColor(message))
			.setImage(getImageUrl(url) ?? 'https://i.imgur.com/vKUeMoH.png')
			.setFooter({ text: args.t(LanguageKeys.Commands.Animation.WaifuFooter) })
			.setTimestamp();
		return send(message, { embeds: [embed] });
	}
}
