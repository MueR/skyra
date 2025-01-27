import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['choose', 'choise', 'pick'],
	description: LanguageKeys.Commands.Fun.ChoiceDescription,
	detailedDescription: LanguageKeys.Commands.Fun.ChoiceExtended
})
export class UserCommand extends SkyraCommand {
	public async messageRun(message: Message, args: SkyraCommand.Args) {
		const options = args.nextSplit();

		const words = await this.filterWords(options);
		const word = words[Math.floor(Math.random() * words.length)];
		const content = args.t(LanguageKeys.Commands.Fun.ChoiceOutput, { user: message.author.toString(), word });
		return send(message, content);
	}

	private async filterWords(words: string[]) {
		if (words.length < 2) this.error(LanguageKeys.Commands.Fun.ChoiceMissing);

		const output = new Set<string>();
		const filtered = new Set<string>();
		for (const raw of words) {
			const word = raw.trim();
			if (!word) continue;
			if (output.has(word)) filtered.add(word);
			else output.add(word);
		}

		if (output.size >= 2) return [...output];
		this.error(LanguageKeys.Commands.Fun.ChoiceDuplicates, { words: [...filtered].join("', '") });
	}
}
