import {
	IAppAccessors,
	IConfigurationExtend,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IMessageExtender,
	IModify,
	IPersistence,
	IRead
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { IMessage, IPostMessageSent, IPreMessageSentExtend } from "@rocket.chat/apps-engine/definition/messages";
import preMessageSentExtendHandler from "./hooks/preMessageSentExtendHandler";
import PostMessageSentHandler from "./hooks/postMessageSentHandler";
import { settings, SettingsID } from "./constants/settings";
import { IUIKitInteractionHandler } from "@rocket.chat/apps-engine/definition/uikit";
import { UIKitBlockInteractionContext } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext";
import { IUIKitResponse } from "@rocket.chat/apps-engine/definition/uikit/IUIKitInteractionType";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { buildWarningMessage } from "./uikit/warning-message";

export class AntiBotsApp extends App implements IPreMessageSentExtend, IPostMessageSent, IUIKitInteractionHandler {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		await Promise.all(settings.map(setting => configurationExtend.settings.provideSetting(setting)));
	}

	executePreMessageSentExtend(message: IMessage, extend: IMessageExtender, read: IRead): Promise<IMessage> {
		const handler = new preMessageSentExtendHandler(message, extend, read);
		return handler.run();
	}

	executePostMessageSent(
		message: IMessage,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify
	): Promise<void> {
		const handler = new PostMessageSentHandler(message, read, http, persistence, modify);
		return handler.run();
	}

	async executeBlockActionHandler(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify
	): Promise<IUIKitResponse> {
		const { value, user, message } = context.getInteractionData();

		if (!message?.id) {
			return context.getInteractionResponder().errorResponse();
		}

		const appUser = (await read.getUserReader().getAppUser()) as IUser;
		const updater = await modify.getUpdater().message(message.id, appUser);
		updater.setEditor(appUser);

		if (value === "agree") {
			await modify.getUpdater().getUserUpdater().updateCustomFields(user, {
				blocked: false
			});
			updater.setText("Confirmation has been sent");
			updater.setBlocks([]);
		} else {
			const warningMessage = await read
				.getEnvironmentReader()
				.getSettings()
				.getValueById(SettingsID.WARNING_MESSAGE);
			updater.setBlocks(buildWarningMessage(modify, warningMessage, true));
		}

		await modify.getUpdater().finish(updater);

		return context.getInteractionResponder().successResponse();
	}
}
