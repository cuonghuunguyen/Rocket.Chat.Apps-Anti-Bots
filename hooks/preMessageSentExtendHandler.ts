import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IMessageExtender, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { hello } from "../constants/hello";
import { SettingsID } from "../constants/settings";

class PreMessageSentExtendHandler {
	constructor(private message: IMessage, private extend: IMessageExtender, private read: IRead) {}

	public async run(): Promise<IMessage> {
		const { text, sender } = this.message;
		const settingsReader = this.read.getEnvironmentReader().getSettings();
		if (sender.customFields?.blocked) {
			this.blockMessage();
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

			this.blockMessage();
		}

		return this.extend.getMessage();
	}

	blockMessage() {
		// @ts-ignore Hide the message
		// As I told you, we need this https://github.com/RocketChat/Rocket.Chat.Apps-engine/issues/352 to send a warning message :D
		this.extend.msg._unmappedProperties_.t = "hidden";

		this.extend.addCustomField("blocked", true);
	}
}

export default PreMessageSentExtendHandler;
