import PromptEditor from "./PromptEditor";

export const textRenderer = (
	input: any,
	onChange: any,
	index: any,
	defaultPromptValue: any,
) => (
	<PromptEditor
		value={input.value}
		onChange={onChange}
		key={index}
		defaultPromptValue={defaultPromptValue}
	/>
);
