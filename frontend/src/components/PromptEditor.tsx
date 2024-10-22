import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-dropdown-select";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useLocalStorage } from "../hooks";

export interface Props {
	value: string;
	defaultPromptValue?: string;
	onChange: any;
	bookmarkedPrompts: any;
	setBookmarkedPrompts: any;
}

export const toSelectPropList = (input: Array<string>) => input.map((value:any)=> ({value, label:value}))
export const fromSelectPropList  = (input: Array<{value:string,label:string}>) => input.map((item:any)=> item.value)
export default ({
	onChange,
	value,
	defaultPromptValue,
	bookmarkedPrompts,
	setBookmarkedPrompts,
}: Props) => {
	const selectRef = useRef(null);
	const [tabIndex, setTabIndex] = useLocalStorage("promptTabIndex", 0);
	const [availablePromptTags, setAvailablePromptTags] = useLocalStorage<Array<string>>("availablePromptTags", []);// can be selected
	const [promptTags, setPromptTags] = useLocalStorage<Array<string>>("promptTags", []);// selected now
	const [textPrompt, setTextPrompt] = useLocalStorage('defaultPromptValue',defaultPromptValue);
	const [isTagsPinned, setIsTagsPinned] = useLocalStorage("tagsMenuOpen", true);

	// console.log({ isTagsPinned, unusedTags });
	useEffect(() => {
		console.log({ promptTags, textPrompt });
		const combinedPrompt = `${promptTags.join(",")}, ${textPrompt}`;
		onChange(combinedPrompt);
	}, [promptTags, textPrompt]);

	const onSetNewTags = (newOptions: Array<string>) => {
		const newUniqueTagOptions = newOptions.filter(newItem => !promptTags.some(option=> option === newItem))
		setPromptTags([...promptTags, ...newUniqueTagOptions])
		const newAvailablePromptTagsNoDups = new Set([...availablePromptTags,...promptTags, ...newUniqueTagOptions])
		setAvailablePromptTags(Array.from(newAvailablePromptTagsNoDups))
	}
	const onCreateNew = (newOption: string) => {
		// console.log('-- create new tag -->',{ newOption });
		// const hasOption = selectOptions.find(
		// 	(item) => item.value === newOption.value,
		// );
		// // console.log({ newOption, hasOption });
		// if (hasOption) return;
		// setSelectOptions((prev) => [...prev, newOption]);
		console.log({newOption})
		onSetNewTags([newOption])
	};

	const onChangeTextPrompt = (event: any) => {
		setTextPrompt(event.target.value);
	};

	useEffect(() => {
		if (!isTagsPinned && selectRef.current) {
			// console.log({ selectRef });
		}
	}, [isTagsPinned, selectRef]);

	const SelectTagOption = useMemo(
		() =>
			({ item }: any) => {
				// console.log({item, props, state, methods, itemIndex})
				const onSelectItem = () => {
					//@ts-ignore
					setPromptTags((prev: any) => [...prev, item.value]);
				};
				const onDeleteTag = () => {
					setPromptTags((prev) =>
						prev.filter((option) => option !== item.value),
					);
				};
				return (
					<div className="flex spaced" key={`${item.label}`}>
						<div onClick={() => onSelectItem()}>{item.label}</div>
						<div onClick={onDeleteTag}>[X]</div>
					</div>
				);
			},
		[setPromptTags],
	);

	const BookmarkSelector = useMemo(() => {
		const bookmarkedPromptsOptions = Object.keys(bookmarkedPrompts ?? {})
			.map((key) => ({ label: key, value: bookmarkedPrompts[key] }))
			.concat([{ value: "", label: " Add bookmark" }]);
		console.log({ bookmarkedPromptsOptions, bookmarkedPrompts, value });

		const onChange = (newSelected: any) => {
			console.log({ newSelected, promptTags });
			if (!newSelected[0]) {
				const ask = prompt("Create a new bookmark?", "my bookmark");
				return;
			}
			const newTags = newSelected[0].value?.tags
				?.split(",")
				
			
			if (newTags) {
				console.log('--- set new tags', {newTags})
				onSetNewTags(newTags);
			}
		}
		return (
			<div className="bookmakrs-selector">
				<Select
					options={bookmarkedPromptsOptions}
					onChange={onChange}
					contentRenderer={() => <div title="bookamrks">Bookmarks</div>}
					optionRenderer={(item: any) => (
						<div
						key={`${item.value}`}
							onClick={()=> onChange([{value: {tags: item.value.tags,}}])}
							// style={{width: '300px'}}
							// className={`flex spaced ${item.value === currentCollection ? "react-dropdown-select-item-selected" : ""}`}
						>
							<div>{item.label}</div>
							{item.value && <div onClick={console.log}>[R]</div>}
						</div>
					)}
					values={[]}
					searchable
					dropdownGap={0}
				/>
			</div>
		);
	}, [bookmarkedPrompts, setPromptTags, ]);
	const promptTagsProp: any = toSelectPropList(promptTags)
	console.log({ value, promptTagsProp, availablePromptTags})

	return (
		<div
			className="flex padded-x prompt-editor"
			id="prompt-editor"
			onClick={() => {
				setIsTagsPinned(false);
			}}
			onBlur={() => {
				setIsTagsPinned(false);
			}}
		>
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
							<Select
								options={toSelectPropList(availablePromptTags.filter(item => !promptTags.includes(item)))}
								onCreateNew={(item: any)=> onCreateNew(item.value)}
								create
								ref={selectRef}
								keepOpen={isTagsPinned}
								dropdownHandle={isTagsPinned}
								multi
								values={promptTagsProp}
								onChange={(newTags) => {
									console.log('---- NEW TAGS SET ', {newTags})
									setIsTagsPinned(false);
									setPromptTags(fromSelectPropList(newTags));
								}}
								clearable
								searchable
								keepSelectedInList
								//@ts-ignore
								portal={document.getElementById("root")}
								dropdownPosition="top"
								itemRenderer={SelectTagOption}
								// wrapperClassName="tags-selector"
							/>
						</div>
					</div>
				</TabPanel>
				<TabPanel>
					<button>res</button>
					<div className="flex">
						<textarea
							className="prompt-field"
							onChange={onChangeTextPrompt}
							// key={index}
							value={textPrompt}
						></textarea>
					</div>
				</TabPanel>
			</Tabs>
		</div>
	);
};
