import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-dropdown-select";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useLocalStorage } from "../hooks";

export interface Props {
	value: string;
	defaultPromptValue?: string;
	onChange: any;
}

export default ({ onChange, value, defaultPromptValue }: Props) => {
	const selectRef = useRef(null);
	const [tabIndex, setTabIndex] = useLocalStorage("promptTabIndex", 0);
	const [selectOptions, setSelectOptions] = useLocalStorage<Array<any>>(
		"selectOptions",
		[],
	);
	const [promptTags, setPromptTags] = useLocalStorage("promptTags", []);
	const [textPrompt, setTextPrompt] = useState(defaultPromptValue);
	const [isTagsPinned, setIsTagsPinned] = useLocalStorage("tagsMenuOpen", true);

	// console.log({ defaultPromptValue });
	const unusedTags = useMemo(() => {
		const result = selectOptions.filter(
			(option) => !value.includes(option.value),
		);
		return result;
	}, [selectOptions, value]);

	// console.log({ isTagsPinned, unusedTags });
	useEffect(() => {
		console.log({ promptTags, textPrompt });
		const combinedPrompt = `${promptTags.map((item: any) => item.value).join(",")}, ${textPrompt}`;
		console.log({ combinedPrompt, value });

		onChange(combinedPrompt);
	}, [promptTags, textPrompt]);

	const onCreateNew = (newOption: any) => {
		// console.log({ selectOptions });
		const hasOption = selectOptions.find(
			(item) => item.value === newOption.value,
		);
		// console.log({ newOption, hasOption });
		if (hasOption) return;
		setSelectOptions((prev) => [...prev, newOption]);
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
					setSelectOptions((prev) =>
						prev.filter((option) => option.value !== item.value),
					);
				};
				return (
					<div className="flex spaced">
						<div onClick={() => onSelectItem()}>{item.label}</div>
						<div onClick={onDeleteTag}>[X]</div>
					</div>
				);
			},
		[setPromptTags, setSelectOptions],
	);
	return (
		<div
			className="flex padded-x"
			id="prompt-editor"
			onClick={() => {
				setIsTagsPinned(false);
			}}
			onBlur={() => {
				setIsTagsPinned(false);
			}}
		>
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
