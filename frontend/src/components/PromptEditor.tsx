import { useEffect, useMemo } from "react";
import Select from "react-dropdown-select";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useLocalStorage } from "../hooks";

import TagsSelector from "./TagsSelector";

export interface Props {
	value: string;
	defaultPromptValue?: string;
	onChange: any;
	bookmarkedPrompts: any;
	onAddBookmarkedPrompt: any;
}

export const toSelectPropList = (input: Array<string>) =>
	input.map((value: any) => ({ value, label: value }));
export const fromSelectPropList = (
	input: Array<{ value: string; label: string }>,
) => input.map((item: any) => item.value);
export default ({
	onChange,
	value,
	defaultPromptValue,
	bookmarkedPrompts,
	onAddBookmarkedPrompt,
}: Props) => {
	const [tabIndex, setTabIndex] = useLocalStorage("promptTabIndex", 0);
	const [availablePromptTags, setAvailablePromptTags] = useLocalStorage<
		Array<string>
	>("availablePromptTags", []); // can be selected
	const [promptTags, setPromptTags] = useLocalStorage<Array<string>>(
		"promptTags",
		[],
	); // selected now
	const [textPrompt, setTextPrompt] = useLocalStorage(
		"defaultPromptValue",
		defaultPromptValue,
	);

	useEffect(() => {
		const combinedPrompt = `${promptTags.join(",")}, ${textPrompt}`;
		// console.log("-- onChange prompt", {
		// 	promptTags,
		// 	textPrompt,
		// 	combinedPrompt,
		// });
		onChange(combinedPrompt);
	}, [promptTags, textPrompt]);

	const onSetNewTags = (newOptions: Array<string>) => {
		const newUniqueTagOptions = newOptions.filter(
			(newItem) => !promptTags.some((option) => option === newItem),
		);
		// todo add an option here to merge to the previous ones - ...promptTags, ...newUnique...
		setPromptTags([...newUniqueTagOptions]);
		const newAvailablePromptTagsNoDups = new Set([
			...availablePromptTags,
			...promptTags,
			...newUniqueTagOptions,
		]);
		setAvailablePromptTags(Array.from(newAvailablePromptTagsNoDups));
	};

	const onChangeTextPrompt = (event: any) => {
		setTextPrompt(event.target.value);
	};

	const BookmarkSelector = useMemo(() => {
		const bookmarkedPromptsOptions: any = Object.keys(
			bookmarkedPrompts ?? {},
		).map((key) => ({ label: key, value: bookmarkedPrompts[key] }));
		// .concat([{ value: "", label: " Add bookmark" }]);
		console.log({ bookmarkedPromptsOptions, bookmarkedPrompts, value });

		const onChange = (newSelected: any) => {
			console.log({ newSelected, promptTags });
			if (!newSelected[0]) {
				return;
			}
			const newTags = newSelected[0].value?.tags?.split(",");

			if (newTags) {
				console.log("--- set new tags", { newTags });
				onSetNewTags(newTags);
			}
		};
		const onCreateNew = (newBookmark: any) => {
			console.log({ newBookmark, bookmarkedPrompts });
			const tags = promptTags.join(",");
			const key = newBookmark.value;
			onAddBookmarkedPrompt(key, { tags, text: textPrompt });
		};
		return (
			<div className="bookmakrs-selector">
				<Select
					options={bookmarkedPromptsOptions}
					onChange={onChange}
					// contentRenderer={() => <div title="bookamrks">Bookmarks</div>}
					optionRenderer={(item: any) => (
						<div
							key={`${item.value}`}
							onClick={() => onChange([{ value: { tags: item.value.tags } }])}
							// style={{width: '300px'}}
							// className={`flex spaced ${item.value === currentCollection ? "react-dropdown-select-item-selected" : ""}`}
						>
							<div>{item.label}</div>
							{item.value && <div onClick={console.log}>[R]</div>}
						</div>
					)}
					values={[]}
					searchable
					create
					onCreateNew={onCreateNew}
					dropdownGap={0}
				/>
			</div>
		);
	}, [bookmarkedPrompts, setPromptTags]);
	const promptTagsProp: any = toSelectPropList(promptTags);
	console.log({ value, promptTagsProp, availablePromptTags });

	const onPasteTextFromClipboard = () => {
		navigator.clipboard.readText().then((clip) => {
			console.log("clipboard", { clip });
			const ask = confirm(
				`Are you sure you want to replace the current text prompt with:\n\n${clip}`,
			);
			if (clip && ask) {
				setTextPrompt(clip);
			}
		});
	};
	const onAddTagsFromClipboard = () => {
		navigator.clipboard.readText().then((clip) => {
			console.log("clipboard", { clip, textPrompt });
			const textPromptAsArr = textPrompt?.split(",").map((item) => item.trim());
			const filteredPrompt = clip
				.split(",")
				.map((item) => item.trim())
				.filter((item) => !textPromptAsArr?.includes(item));
			if (filteredPrompt.length === 0) return;
			const ask = confirm(
				`Are you sure you want to replace the current prompt with:\n\n${filteredPrompt.join(", ")}`,
			);
			if (ask) {
				setPromptTags(filteredPrompt);
			}
		});
	};

	return (
		<div className="flex padded-x prompt-editor" id="prompt-editor">
			{BookmarkSelector}

			<Tabs selectedIndex={tabIndex} onSelect={setTabIndex}>
				<TabList>
					<Tab>tags</Tab>
					<Tab>+text</Tab>
				</TabList>
				<TabPanel>
					<div className="flex">
						<div
							className="prompt-field"
							// style={{overflow:"auto"}}
						>
							<TagsSelector
								onSetNewTags={onSetNewTags}
								promptTags={promptTags}
								setPromptTags={setPromptTags}
								setAvailablePromptTags={setAvailablePromptTags}
								availablePromptTags={availablePromptTags}
								onAddTagsFromClipboard={onAddTagsFromClipboard}
							></TagsSelector>
						</div>
					</div>
				</TabPanel>
				<TabPanel>
					<div className="prompt-field">
						<textarea
							className="prompt-field-text"
							onChange={onChangeTextPrompt}
							// key={index}
							value={textPrompt}
						></textarea>
					</div>
					<button onClick={() => onPasteTextFromClipboard()}>
						Paste from clipboard
					</button>
				</TabPanel>
			</Tabs>
		</div>
	);
};
