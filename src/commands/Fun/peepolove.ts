import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { assetsFolder } from '#utils/constants';
import { getImage, radians } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Canvas, Image, resolveImage } from 'canvas-constructor/skia';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { Message } from 'discord.js';
import { join } from 'node:path';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['pepelove'],
	description: LanguageKeys.Commands.Fun.PeepoLoveDescription,
	detailedDescription: LanguageKeys.Commands.Fun.PeepoLoveExtended,
	requiredClientPermissions: [PermissionFlagsBits.AttachFiles]
})
export class UserCommand extends SkyraCommand {
	private bodyImage: Image = null!;
	private handsImage: Image = null!;

	public async messageRun(message: Message, args: SkyraCommand.Args) {
		const userAttachment = getImage(message);
		const imageBuffer = userAttachment ? await resolveImage(userAttachment) : await args.pick('image');
		const attachment = await new Canvas(512, 512)
			.printImage(this.bodyImage, 0, 0, 512, 512)
			.translate(135, 410)
			.rotate(radians(-45))
			.printCircularImage(imageBuffer, 0, 0, 165, { fit: 'cover' })
			.resetTransformation()
			.printImage(this.handsImage, 0, 0, 512, 512)
			.png();

		return send(message, { files: [{ attachment, name: 'peepoLove.png' }] });
	}

	public async onLoad() {
		[this.bodyImage, this.handsImage] = await Promise.all([
			resolveImage(join(assetsFolder, '/images/generation/peepoBody.png')),
			resolveImage(join(assetsFolder, '/images/generation/peepoHands.png'))
		]);
	}
}
