import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { Scope } from '#lib/types';
import { isPrivateMessage } from '#utils/common';
import { cdnFolder } from '#utils/constants';
import { fetchGlobalRank, fetchLocalRank, formatNumber } from '#utils/functions';
import { fetchAvatar, sanitizeInput } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Canvas, Image, resolveImage } from 'canvas-constructor/skia';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { Message, User } from 'discord.js';
import type { TFunction } from 'i18next';
import { join } from 'node:path';

// Skyra's CDN assets folder
const THEMES_FOLDER = join(cdnFolder, 'skyra-assets', 'banners');
const BADGES_FOLDER = join(cdnFolder, 'skyra-assets', 'badges');

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Social.ProfileDescription,
	detailedDescription: LanguageKeys.Commands.Social.ProfileExtended,
	requiredClientPermissions: [PermissionFlagsBits.AttachFiles]
})
export class UserCommand extends SkyraCommand {
	private lightThemeTemplate: Image = null!;
	private darkThemeTemplate: Image = null!;
	private lightThemeDock: Image = null!;
	private darkThemeDock: Image = null!;

	public async messageRun(message: Message, args: SkyraCommand.Args) {
		const scope = args.finished || isPrivateMessage(message) ? Scope.Global : await args.pick('scope').catch(() => Scope.Global);
		const user = args.finished ? message.author : await args.pick('userName');

		const output = await this.showProfile(message, scope, user, args.t);
		return send(message, { files: [{ attachment: output, name: 'Profile.png' }] });
	}

	public async showProfile(message: Message, scope: Scope, user: User, t: TFunction) {
		const { members, users } = this.container.db;
		const settings = await users.ensureProfile(user.id);
		const { level, points } = scope === Scope.Local && message.guild ? await members.ensure(user.id, message.guild.id) : settings;

		/* Calculate information from the user */
		const previousLevel = Math.floor((level / 0.2) ** 2);
		const nextLevel = Math.floor(((level + 1) / 0.2) ** 2);
		const progressBar = Math.max(Math.round(((points - previousLevel) / (nextLevel - previousLevel)) * 364), 6);

		/* Global leaderboard */
		const rank = await (scope === Scope.Local ? fetchLocalRank(user, message.guild!) : fetchGlobalRank(user));
		const [themeImageSRC, imgAvatarSRC] = await Promise.all([
			resolveImage(join(THEMES_FOLDER, `${settings.profile.bannerProfile}.png`)),
			fetchAvatar(user, 256)
		]);

		const title = t(LanguageKeys.Commands.Social.Profile);
		const canvas = new Canvas(settings.profile.publicBadges.length ? 700 : 640, 391);
		if (settings.profile.publicBadges.length) {
			const badges = await Promise.all(settings.profile.publicBadges.map((name) => resolveImage(join(BADGES_FOLDER, `${name}.png`))));

			canvas.printImage(settings.profile.darkTheme ? this.darkThemeDock : this.lightThemeDock, 600, 0, 100, 391);
			let position = 20;
			for (const badge of badges) {
				canvas.printImage(badge, 635, position, 50, 50);
				position += 74;
			}
		}

		return (
			canvas
				// Images
				.save()
				.createRoundedClip(10, 10, 620, 371, 8)
				.printImage(themeImageSRC, 9, 9, 188, 373)
				.restore()
				.printImage(settings.profile.darkTheme ? this.darkThemeTemplate : this.lightThemeTemplate, 0, 0, 640, 391)

				// Progress bar
				.setColor(`#${settings.profile.color.toString(16).padStart(6, '0') || 'FF239D'}`)
				.printRoundedRectangle(227, 352, progressBar, 9, 3)

				// Name title
				.setTextFont('35px RobotoRegular')
				.setColor(settings.profile.darkTheme ? '#F0F0F0' : '#171717')
				.printResponsiveText(sanitizeInput(user.username), 227, 73, 306)
				.setTextFont('25px RobotoLight')
				.printText(`#${user.discriminator}`, 227, 105)

				// Statistics Titles
				.printText(title.globalRank, 227, 276)
				.printText(title.credits, 227, 229)
				.printText(title.reputation, 227, 181)

				// Experience
				.setTextFont('20px RobotoLight')
				.printText(title.experience, 227, 342)

				// Statistics Values
				.setTextAlign('right')
				.setTextFont('25px RobotoLight')
				.printText(rank.toString(), 594, 276)
				.printText(t(LanguageKeys.Commands.Social.ProfileMoney, { money: settings.money, vault: settings.profile.vault }), 594, 229)
				.printText(t(LanguageKeys.Globals.NumberCompactValue, { value: settings.reputations }), 594, 181)
				.printText(formatNumber(t, points), 594, 346)

				// Level
				.setTextAlign('center')
				.setTextFont('30px RobotoLight')
				.printText(title.level, 576, 58)
				.setTextFont('40px RobotoRegular')
				.printText(formatNumber(t, level), 576, 100)

				// Avatar
				.printCircularImage(imgAvatarSRC, 103, 103, 71)
				.png()
		);
	}

	public async onLoad() {
		[this.lightThemeTemplate, this.darkThemeTemplate, this.lightThemeDock, this.darkThemeDock] = await Promise.all([
			new Canvas(640, 391)
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#FFFFFF')
				.createRoundedPath(10, 10, 620, 371, 8)
				.fill()
				.createRoundedClip(10, 10, 620, 371, 5)
				.clearRectangle(10, 10, 186, 371)
				.printCircle(103, 103, 70.5)
				.resetShadows()
				.setColor('#E8E8E8')
				.printRoundedRectangle(226, 351, 366, 11, 4)
				.png()
				.then(resolveImage),
			new Canvas(640, 391)
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#202225')
				.createRoundedPath(10, 10, 620, 371, 8)
				.fill()
				.createRoundedClip(10, 10, 620, 371, 5)
				.clearRectangle(10, 10, 186, 371)
				.printCircle(103, 103, 70.5)
				.resetShadows()
				.setColor('#2C2F33')
				.printRoundedRectangle(226, 351, 366, 11, 4)
				.png()
				.then(resolveImage),
			new Canvas(100, 391)
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#E8E8E8')
				.createRoundedPath(10, 10, 80, 371, 8)
				.fill()
				.png()
				.then(resolveImage),
			new Canvas(100, 391)
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#272A2E')
				.createRoundedPath(10, 10, 80, 371, 8)
				.fill()
				.png()
				.then(resolveImage)
		]);
	}
}
