import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";

export const buildWarningMessage = (modify: IModify, warningMessage: string, declined?: boolean) => {
	const block = modify.getCreator().getBlockBuilder();

	if (declined) {
		block.addSectionBlock({
			text: block.newMarkdownTextObject(
				"**:warning: You won't be able to send messages util you accept the term**"
			)
		});
	}

	block.addSectionBlock({
		text: block.newMarkdownTextObject(warningMessage)
	});

	block.addActionsBlock({
		elements: [
			block.newButtonElement({
				text: block.newPlainTextObject("I disagree"),
				style: ButtonStyle.DANGER,
				value: "disagree",
				actionId: "confirm"
			}),
			block.newButtonElement({
				text: block.newPlainTextObject("I have read and agree with it"),
				style: ButtonStyle.PRIMARY,
				value: "agree",
				actionId: "confirm"
			})
		]
	});
	return block;
};
