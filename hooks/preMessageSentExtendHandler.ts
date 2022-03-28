import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IMessageExtender, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { hello } from "../constants/hello";
import { SettingsID } from "../constants/settings";

class PreMessageSentExtendHandler {
	constructor(private message: IMessage, private extend: IMessageExtender, private read: IRead) {}

	public async run(): Promise<IMessage> {
		const { text, sender } = this.message;
		const settingsReader = this.read.getEnvironmentReader().getSettings();

		// If the sender is already blocked, we will block this message also.
		if (sender.customFields?.blocked) {
			return this.blockMessage();
		}

		if (text) {
			const additionalBlockWordsSettings: string = await settingsReader.getValueById(
				SettingsID.ADDITIONAL_BLOCK_WORDS
			);

			const additionalBlockWords =
				additionalBlockWordsSettings
					.split(",")
					.map(word => word.trim())
					.filter(Boolean) || [];

			const blockedWords = [...hello, ...additionalBlockWords];

			if (!blockedWords.includes(text.trim())) {
				return this.extend.getMessage();
			}

			return this.blockMessage();
		}

		return this.extend.getMessage();
	}

	/**
	 * The reason why I have to hide it instead of block it entirely in `preMessageSentPrevent` is that
	 * we need to do some more stuffs like block the user and block send messages.
	 * What I do here:
	 * * Mark this message as blocked for future detection
	 * * Add the type hidden so that the message won't show up
	 * @see https://github.com/RocketChat/Rocket.Chat.Apps-engine/issues/352 to send a warning message :D
	 */
	blockMessage(): IMessage {
		/**
		 * We cannot change type of the message, this is a workaround
		 */
		(this.extend as any).msg._unmappedProperties_ = {
			t: "hidden"
		};

		this.extend.addCustomField("blocked", true);
		return this.extend.getMessage();
	}
}

export default PreMessageSentExtendHandler;
