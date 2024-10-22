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

export default ({
	onChange,
	value,
	defaultPromptValue,
	bookmarkedPrompts,
	setBookmarkedPrompts,
}: Props) => {
	const selectRef = useRef(null);
	const [tabIndex, setTabIndex] = useLocalStorage("promptTabIndex", 0);
	// const [selectOptions, setSelectOptions] = useLocalStorage<Array<any>>(
	// 	"selectOptions",
	// 	[],
	// );
	const [availableTags, setAvailableTags] = useState<any>(new Set([]))
	const [promptTags, setPromptTags] = useLocalStorage<Array<any>>("promptTags", []);
	const [textPrompt, setTextPrompt] = useLocalStorage('defaultPromptValue',defaultPromptValue);
	const [isTagsPinned, setIsTagsPinned] = useLocalStorage("tagsMenuOpen", true);

	// console.log({ defaultPromptValue });
	const unusedTags = useMemo(() => {
		const splitValues = value.split(',').map(item=> item.trim())
		
		const result = promptTags.filter(
			(option) => !splitValues.includes(option.value.trim()),// todo value is the combined result of the prompt
		);
		console.log({splitValues, result, promptTags})
		return result;
	}, [value, promptTags]);

	// console.log({ isTagsPinned, unusedTags });
	useEffect(() => {
		console.log({ promptTags, textPrompt });
		const combinedPrompt = `${promptTags.map((item: any) => item.value).join(",")}, ${textPrompt}`;
		console.log({ combinedPrompt, value });
		setAvailableTags((prev: any) => ([...prev, textPrompt?.split(',').map(item=>item.trim())]))
		onChange(combinedPrompt);
	}, [promptTags, textPrompt]);

	const onSetNewTags = (newOptions: Array<any>) => {
		const newUniqueTagOptions = newOptions.filter(newItem => !promptTags.some(option=> option.value === newItem.value) )
		setPromptTags([...promptTags, ...newUniqueTagOptions])
	}
	const onCreateNew = (newOption: any) => {
		// console.log('-- create new tag -->',{ newOption });
		// const hasOption = selectOptions.find(
		// 	(item) => item.value === newOption.value,
		// );
		// // console.log({ newOption, hasOption });
		// if (hasOption) return;
		// setSelectOptions((prev) => [...prev, newOption]);
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
					setPromptTags((prev: any) => [...prev, item]);
				};
				const onDeleteTag = () => {
					setPromptTags((prev) =>
						prev.filter((option) => option.value !== item.value),
					);
				};
				return (
					<div className="flex spaced" key={`${item.label}`}>
						<div onClick={() => onSelectItem()}>{item.label}</div>
						<div onClick={onDeleteTag}>[X]</div>
					</div>
				);
			},
		[setPromptTags, setPromptTags],
	);

	const BookmarkSelector = useMemo(() => {
		const bookmarkedPromptsOptions = Object.keys(bookmarkedPrompts ?? {})
			.map((key) => ({ label: key, value: bookmarkedPrompts[key] }))
			.concat([{ value: "", label: " Add bookmark" }]);
		console.log({ bookmarkedPromptsOptions, bookmarkedPrompts, value });
		return (
			<div className="bookmakrs-selector">
				<Select
					options={bookmarkedPromptsOptions}
					onChange={(newSelected: any) => {
						console.log({ newSelected, promptTags });
						if (!newSelected[0]) {
							const ask = prompt("Create a new bookmark?", "my bookmark");
							return;
						}
						const newTags = newSelected[0].value?.tags
							?.split(",")
							?.map((value: string) => ({ value, label: value }));
						
						if (newTags) {
							console.log('--- set new tags', {newTags})
							setPromptTags(newTags);
							// onSetNewTags(newTags);
							// setSelectOptions((prev) => [...prev, ...newTags]);
						}
						// onSetCurrentWorkflowData(newSelected[0].value);
					}}
					contentRenderer={() => <div title="bookamrks">Bookmarks</div>}
					optionRenderer={(item: any) => (
						<div
						key={`${item.value}`}
							onClick={console.log}
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
	console.log({ value, unusedTags, availableTags})
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
								options={unusedTags}
								onCreateNew={onCreateNew}
								create
								// labelField="name"
								// valueField="id"
								ref={selectRef}
								keepOpen={isTagsPinned}
								// closeOnSelect={!isTagsPinned}
								dropdownHandle={isTagsPinned}
								multi
								values={promptTags}
								onChange={(newTags) => {
									console.log('---- NEW TAGS SET ', {newTags})
									setIsTagsPinned(false);
									setPromptTags(newTags as any);
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
