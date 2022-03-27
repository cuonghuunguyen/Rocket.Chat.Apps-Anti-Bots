import { ISetting, SettingType } from "@rocket.chat/apps-engine/definition/settings";

export enum SettingsID {
	WARNING_MESSAGE = "WARNING_MESSAGE",
	ADDITIONAL_BLOCK_WORDS = "ADDITIONAL_BLOCK_WORDS"
}

export const settings: ISetting[] = [
	{
		id: SettingsID.ADDITIONAL_BLOCK_WORDS,
		public: false,
		required: false,
		multiline: true,
		packageValue: "",
		i18nLabel: "additional_block_words_label",
		type: SettingType.STRING
	},
	{
		id: SettingsID.WARNING_MESSAGE,
		public: false,
		required: false,
		multiline: true,
		packageValue: `People, don't just \`Hello\` or \`Hi\` here, please!
https://nohello.net/en/
If you have your question, greet in first line, and ask your question in second line. Just easy like that!
That annoying single line nonsense greetings from spambots are awful thing and makes that server less useful.
Please don't help bots to spam that server totally.
Thank you!`,
		i18nLabel: "warning_message_label",
		i18nDescription: "warning_message_desc",
		type: SettingType.STRING
	}
];
