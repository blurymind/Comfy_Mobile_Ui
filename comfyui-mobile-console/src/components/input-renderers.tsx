import PromptEditor from "./PromptEditor";

export const textRenderer = (
	input: any,
	onChange: any,
	key: string,
	defaultPromptValue: any,
) => (
	<PromptEditor
		value={input.value}
		onChange={onChange}
		key={key}
		defaultPromptValue={defaultPromptValue}
	/>
);
