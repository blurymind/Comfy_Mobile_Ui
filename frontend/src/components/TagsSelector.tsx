import {
	// PointerEventHandler,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import Select from "react-dropdown-select";
import {
	SortableContainer,
	// SortableContainerProps,
	SortableElement,
	// SortEndHandler,
	SortableHandle,
} from "react-sortable-hoc";

function arrayMove<T>(array: readonly T[], from: number, to: number) {
	const slicedArray = array.slice();
	slicedArray.splice(
		to < 0 ? array.length + to : to,
		0,
		slicedArray.splice(from, 1)[0],
	);
	return slicedArray;
}
const DragHandle = SortableHandle(({ children }: any) => (
	<span>{children}</span>
));
const SortableItem = SortableElement(({ value, onRemoveTag }: any) => (
	<div className="selectable-tag">
		<DragHandle>{value}</DragHandle>,
		<div className="remove-tag" onClick={() => onRemoveTag(value)}>
			×
		</div>
	</div>
));
const SortableList = SortableContainer(({ children }: any) => {
	return (
		<div
			className="no-user-select sortable-area"
			style={{ display: "flex", flexWrap: "wrap" }}
		>
			{children}
		</div>
	);
});

export const toSelectPropList = (input: Array<string>) =>
	input.map((value: any) => ({ value, label: value }));
export const fromSelectPropList = (
	input: Array<{ value: string; label: string }>,
) => input.map((item: any) => item.value);

export default ({
	promptTags,
	setPromptTags,
	availablePromptTags,
	setAvailablePromptTags,
	onSetNewTags,
	onAddTagsFromClipboard,
}: any) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [isTagsPinned, setIsTagsPinned] = useState(false);
	const selectRef = useRef(null);
	const searchRef = useRef(null);

	const onCreateNew = (newOption: string) => {
		onSetNewTags([newOption]);
	};

	useEffect(() => {
		if (!isTagsPinned && selectRef.current) {
		}
	}, [isTagsPinned, selectRef]);

	const SelectTagOption = useMemo(
		() =>
			({ item }: any) => {
				// console.log({item, props, state, methods, itemIndex})
				const onSelectItem = () => {
					//@ts-ignore
					setPromptTags((prev: any) => [...prev, item.value]);
					// setSearchQuery("");
				};
				const onDeleteTag = () => {
					console.log("delete", { item });
					setPromptTags((prev: any) =>
						prev.filter((option: any) => option !== item.value),
					);
					setAvailablePromptTags((prev: any) =>
						prev.filter((option: any) => option !== item.value),
					);
				};
				return (
					<div className="flex spaced tag-menu-item" key={`${item.label}`}>
						<div className="flex" onClick={() => onSelectItem()}>
							{item.label}
						</div>
						<div onClick={onDeleteTag} className="remove-tag">
							×
						</div>
					</div>
				);
			},
		[setPromptTags],
	);
	const onSortEnd = ({ oldIndex, newIndex }: any) => {
		const newValue = arrayMove(promptTags, oldIndex, newIndex);
		setPromptTags(newValue);
	};

	const onSearch = (event: any) => {
		event.preventDefault();
		setSearchQuery(event.target.value);
	};

	const onRemoveTag = (value: string) => {
		setPromptTags((prev: any) =>
			prev.filter((option: any) => option !== value),
		);
	};

	const [promptTagsProp, filteredAvailablePromptTags] = useMemo(() => {
		const promptTagsProp: any = toSelectPropList(promptTags);
		const filteredAvailablePromptTags = searchQuery
			? availablePromptTags.filter((item: string) => item.includes(searchQuery))
			: availablePromptTags;
		return [promptTagsProp, filteredAvailablePromptTags];
	}, [availablePromptTags, searchQuery]);
	return (
		<div
			className="prompt-field"
			onBlur={() => {
				setIsTagsPinned(false);
				// setSearchQuery('')
			}}
		>
			<Select
				options={toSelectPropList(
					filteredAvailablePromptTags.filter(
						(item: any) => !promptTags.includes(item),
					),
				)}
				//@ts-ignore
				onDropdownOpen={() => searchRef.current?.focus()}
				onCreateNew={(item: any) => onCreateNew(item.value)}
				create
				ref={selectRef}
				keepOpen={isTagsPinned}
				dropdownHandle={isTagsPinned}
				multi
				backspaceDelete={false}
				values={promptTagsProp}
				onChange={(newTags: any) => {
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
				noDataRenderer={({ props, state }: any) => {
					console.log({ state, props });
					return (
						<div>
							<div>no tags found...</div>
							<button
								onClick={() => {
									onCreateNew(searchQuery);
									// setSearchQuery("");
								}}
							>{`Create "${searchQuery}" tag`}</button>
						</div>
					);
				}}
				contentRenderer={() => {
					return (
						//@ts-ignore
						<SortableList onSortEnd={onSortEnd} useDragHandle axis="xy">
							<input
								className="tag-search-field"
								type="search"
								onChange={onSearch}
								placeholder="search"
								value={searchQuery}
								ref={searchRef}
							/>
							<div
								onClick={() => onAddTagsFromClipboard()}
								title="Paste tags from clipboard"
							>
								▼
							</div>
							{promptTags.map((value: any, index: any) => (
								//@ts-ignore
								<SortableItem
									key={`item-${value}`}
									index={index}
									//@ts-ignore
									value={value as any}
									onRemoveTag={onRemoveTag}
								/>
							))}
						</SortableList>
					);
				}}
			/>
		</div>
	);
};
