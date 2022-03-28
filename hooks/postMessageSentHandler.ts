import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingsID } from "../constants/settings";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { buildWarningMessage } from "../uikit/warning-message";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";

class PostMessageSentHandler {
	constructor(
		private message: IMessage,
		private read: IRead,
		private http: IHttp,
		private persistence: IPersistence,
		private modify: IModify
	) {}

	public async run(): Promise<void> {
		const { customFields, room, sender } = this.message;

		if (![RoomType.DIRECT_MESSAGE, RoomType.CHANNEL].includes(room.type)) {
			return;
		}

		if (customFields?.blocked) {
			const warningMessage = await this.read
				.getEnvironmentReader()
				.getSettings()
				.getValueById(SettingsID.WARNING_MESSAGE);
			const creator = this.modify.getCreator();
			const notifier = this.modify.getNotifier();
			const appUser = (await this.read.getUserReader().getAppUser()) as IUser;

			let directRoom = await this.read.getRoomReader().getDirectByUsernames([appUser.username, sender.username]);

			if (!directRoom) {
				const roomBuilder = this.modify
					.getCreator()
					.startRoom()
					.setCreator(appUser)
					.setType(RoomType.DIRECT_MESSAGE)
					.setMembersToBeAddedByUsernames([appUser.username, sender.username]);

				const roomId = await this.modify.getCreator().finish(roomBuilder);

				directRoom = (await this.read.getRoomReader().getById(roomId)) as IRoom;
			}

			if (!sender.customFields?.blocked) {
				const warningMessageBuilder = creator
					.startMessage()
					.setSender(appUser)
					.setRoom(directRoom)
					.addBlocks(buildWarningMessage(this.modify, warningMessage));

				await creator.finish(warningMessageBuilder);

				await this.modify.getUpdater().getUserUpdater().updateCustomFields(sender, {
					blocked: true
				});
			}

			const blockMessage = notifier
				.getMessageBuilder()
				.setText(`You are temporary block, go [here](/direct/${directRoom.id}) to unlock`)
				.setSender(appUser)
				.setRoom(room);

			await notifier.notifyUser(sender, blockMessage.getMessage());
		}
	}
}

export default PostMessageSentHandler;
