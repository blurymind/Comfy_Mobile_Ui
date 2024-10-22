import PromptEditor from "./PromptEditor";

export const textRenderer = (
	input: any,
	onChange: any,
	key: string,
	defaultPromptValue: any,
	bookmarkedPrompts: any,
	onAddBookmarkedPrompt: any,
) => (
	<PromptEditor
		value={input.value}
		onChange={onChange}
		key={key}
		defaultPromptValue={defaultPromptValue}
		bookmarkedPrompts={bookmarkedPrompts}
		onAddBookmarkedPrompt={onAddBookmarkedPrompt}
	/>
);
