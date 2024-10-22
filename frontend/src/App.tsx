import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { useLocalStorage } from "./hooks";
import {
	COMFY_UI_URL,
	create_collection,
	getLoras,
	getModels,
	getWorkflowText,
	load_api_workflows,
	load_outputs,
	move_outputs,
	rename_collection,
	socket,
} from "./utils";
import Controls from "./components/Controls";
import Select from "react-dropdown-select";

const SelectCollectionOption = ({
	item,
	collections,
	currentCollection,
	setCurrentCollection,
	onLoadOutputs,
	setCollections,
}: any) => {
	const onRenameCollection = () => {
		const ask = prompt(`Rename this "${item.label}" collection?`, item.label);
		if (!ask || ask === item.label) {
			return;
		}
		if (ask in collections) {
			alert(`The collection "${ask}" is already in use. Cancelled`);
			return;
		}
		rename_collection(item.label, ask, () => {
			console.log(` ---- Renamed "${item.label}" to "${ask}"`);
			setCurrentCollection(ask);
			onLoadOutputs();
		});
	};
	const onSelect = () => {
		if (!item.value) {
			const ask = prompt(`Create a new collection?`, item.value);
			if (!ask) return;
			if (ask in collections) {
				alert(`The collection "${ask}" is already in use. Cancelled`);
				return;
			}
			create_collection(ask, () => {
				// todo this is borked
				// setCurrentCollection(ask)
				// window.location.reload();
			});
		} else {
			setCurrentCollection(item.value);
		}
	};
	return (
		<div
			onClick={onSelect}
			className={`flex spaced ${item.value === currentCollection ? "react-dropdown-select-item-selected" : ""}`}
		>
			<div>{item.label}</div>
			{item.value && <div onClick={onRenameCollection}>[R]</div>}
		</div>
	);
};

// console.log({defineConfig})/
function App() {
	const [count, setCount] = useState<number>(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [workflow, setWorkflow] = useLocalStorage<string>(
		"selectedWorkflow",
		"",
	);
	const [workflows, setWorkflows] = useState<any>(null);
	const [altWorkflow, setAltWorkflow] = useState<any>(null);
	const [loaded, setLoaded] = useState(false);
	const [collections, setCollections] = useState<any>({});
	const [currentCollection, setCurrentCollection] = useLocalStorage(
		"currentCollection",
		"",
	);
	const [bookmarkedPrompts, setBookmarkedPrompts] = useState<any>({});
	const onSetCurrentCollection = (nextCollection: string) => {
		if (nextCollection in collections) {
			//todo?
		} else {
			setCollections({ ...collections, [nextCollection]: [] });
		}
		setCurrentCollection(nextCollection);
	};
	console.log({ currentCollection, collections });
	// const [results, setResults] = useState<
	// 	Array<{
	// 		filename: string;
	// 		subfolder: String;
	// 		random: string;
	// 		tags: string;
	// 		loras: string;
	// 		models: string;
	// 	}>
	// >([]);
	const [progress, setProgress] = useState(0);
	const [batch, setBatch] = useLocalStorage("batchRenderOption", 1);
	const [defaultPromptValue, setSufixWorkflowText] = useState(""); // needs to be state
	const resultContainerRef = useRef<HTMLDivElement>(null);

	// from control
	const [promptTags] = useLocalStorage("promptTags", []);

	const onLoadOutputs = () => {
		load_outputs((data: any) => {
			const initResults: any = [];
			const prompts = data.prompts;
			const outputs = data.files;
			// const initCollections: any = [];//todo
			Object.keys(outputs).forEach((subfolder: any) => {
				Object.values(outputs[subfolder]).forEach((file: any) => {
					initResults.push({ filename: file.filename, subfolder });
				});
			});
			console.log("==== App Received user outputs ==", {
				data,
				outputs,
				prompts,
			});
			setCollections(outputs);
			setBookmarkedPrompts(prompts);
			const startKey = Object.keys(outputs)[0];
			console.log({
				startKey,
				currentCollection,
				isIn: currentCollection in collections,
			});
			if (!currentCollection) {
				console.log("Set collection to startKey --> ", { startKey });
				onSetCurrentCollection(startKey);
			} else {
				console.log("err");
			}
			onScrollToBottom();
			// setResults(initResults);
		});
	};
	// get from server
	useEffect(() => {
		if (loaded) return;
		load_api_workflows((workflows: any) => {
			//@ts-ignore
			const [first] = Object.entries(Object.entries(workflows)); //todo make selectable
			const [workflowName] = first[1];
			console.log("==== App Received user workflows ==", { workflows });
			setWorkflow(workflow || (workflowName as any));
			setWorkflows(workflows);
			onLoadOutputs();
		});
	}, [loaded]);
	useEffect(() => {
		if (!loaded && workflows) {
			console.log(
				{ workflows, workflow },
				"======= Loaded user workflows into state",
				workflows,
			);
			onSetCurrentWorkflowData(workflow);
		}
	}, [loaded, workflows, workflow]);
	const onSetCurrentWorkflowData = (key: string) => {
		if (!workflows || !workflow) {
			console.error("Failed to load workflow ", { key, workflow, workflows });
			return;
		}
		const nextKey = key in workflows ? key : Object.keys(workflows)[0];
		if (nextKey !== key) {
			console.error(
				`>>> ${key} fonr found in workflows! Using ${nextKey} instead...`,
				{ workflows },
			);
		}
		setWorkflow(nextKey);
		const nextWorkflow = workflows[nextKey];
		console.log("===== Selecting workflow:: ", {
			nextKey,
			nextWorkflow,
			workflows,
		});
		setAltWorkflow(nextWorkflow);
		const workflowText = getWorkflowText(nextWorkflow);
		setSufixWorkflowText(workflowText);
	};

	const onScrollToBottom = () => {
		setTimeout(() => {
			if (resultContainerRef.current) {
				resultContainerRef.current.scrollTop =
					resultContainerRef.current.scrollHeight;
				// resultContainerRef.current.click();
			}
		}, 170);
	};
	const onSocketMessage = (event: any) => {
		const data = JSON.parse(event.data);
		console.log("---", data);
		if (data.type === "progress") {
			// setIsGenerating(true);
			setProgress(data["data"]["max"] - data["data"]["value"]);
			// console.info(data["data"]["max"], data["data"]["value"]);

			// updateProgress(data['data']['max'], data['data']['value']);
		} else if (data.type === "executed") {
			// console.log("Execution time: " + execution_time + "s", {
			// 	isGenerating,
			// 	progress,
			// });
			if ("images" in data["data"]["output"]) {
				const images = data["data"]["output"]["images"];
				const imageData = images;
				if (imageData[0]?.type === "temp") {
					// console.log(" -- SKIP --");
					return;
				}
				const loras = getLoras(altWorkflow);
				const models = getModels(altWorkflow);

				const newImages: any = {};
				// const newImageFileNames: Array<string> = [];
				imageData
					.filter(
						(item: any) => !item.filename.toLowerCase().includes("_temp_"),
					)
					.forEach((item: any) => {
						const random = Math.random();
						// newImageFileNames.push(item.filename);
						newImages[item.subfolder] = {
							filename: item.filename,
							// subfolder: item.subfolder,
							subfolder: currentCollection,
							// todo this needs to go in meta.json
							random,
							tags: promptTags.map((item: any) => item.value).join(","),
							models,
							loras,
						};
					});
				console.log("--> move:", {
					images,
					newImages,
					currentCollection,
				});
				move_outputs(
					newImages,
					currentCollection,
					workflow,
					(newFiles: any) => {
						console.log("------ MOVED! --------", {
							newFiles,
							count,
							currentCollection,
						});
						setCollections((prev: any) => ({
							...prev,
							[currentCollection]: {
								...prev[currentCollection],
								...newFiles,
							},
						}));
						onScrollToBottom();
					},
				);
			}
		} else if (data.type === "execution_interrupted") {
			console.log("Execution Interrupted");
			setCount(data["data"]["status"]["exec_info"]["queue_remaining"]);
		} else if (data.type === "status") {
			console.log({ data });
			const remaining = data["data"]["status"]["exec_info"]["queue_remaining"];
			setIsGenerating(remaining > 0);
			setCount(remaining);
			if (remaining === 0) {
				if (count === 0) {
					setIsGenerating(false);
					// onScrollToBottom();
					// onLoadOutputs()
				}
			}
		}
	};
	useEffect(() => {
		if (altWorkflow && !loaded) {
			// setAltWorkflow(workflow);
			socket.addEventListener("open", (event) => {
				console.log("============ Connected to the server", { event });
			});
			console.log("========= ADDING SOCKET EVENT LISTENER");
			socket.addEventListener("message", onSocketMessage);
			console.log("🎉🎉🎉🎉 === Initialized! === 🎉🎉🎉🎉🎉");
			setLoaded(true);
		}
	}, [altWorkflow, loaded]);

	if (!loaded) return null;
	const availableWorkflows = Object.keys(workflows ?? {});
	const workflowOptions = availableWorkflows.map((value: any) => ({
		value,
		label: value,
	}));
	const selectedWorkflowProp: any = workflowOptions.find(
		(item) => item.value === workflow,
	) ?? { value: workflow, label: workflow };
	// console.log({collections})
	const collectionOptions: any = Object.keys(collections)
		.map((value) => ({
			label: value,
			value,
		}))
		//@ts-ignore
		.concat([{ value: "", label: "Create new" }]);
	const selectedCollectionProp: any = collectionOptions.find(
		(item: any) => item.value === currentCollection,
	) ?? { value: currentCollection, label: currentCollection };

	const displayedResults: any =
		currentCollection in collections
			? Object.values(collections[currentCollection])
			: [];

	return (
		<>
			<div className="layout-wrapper" id="app-root">
				<div className="top-half" ref={resultContainerRef}>
					<div className="header-controls">
						{workflowOptions.length > 0 && (
							<div className="workflow-selector">
								<Select
									options={workflowOptions}
									onChange={(newSelected: any) => {
										console.log({ newSelected });
										onSetCurrentWorkflowData(newSelected[0].value);
									}}
									values={[selectedWorkflowProp]}
									searchable
									dropdownGap={0}
									disabled={isGenerating}
								/>
							</div>
						)}
						{displayedResults && (
							<>
								<div className="workflow-selector">
									<Select
										options={collectionOptions}
										onChange={(newSelectedCollection: any) => {
											console.log({ newSelectedCollection });
											onSetCurrentCollection(newSelectedCollection[0].value);
										}}
										values={[selectedCollectionProp]}
										searchable
										dropdownGap={0}
										disabled={isGenerating}
										itemRenderer={({ item }) => (
											<SelectCollectionOption
												item={item}
												collections={collections}
												currentCollection={currentCollection}
												setCurrentCollection={onSetCurrentCollection}
												onLoadOutputs={onLoadOutputs}
												setCollections={setCollections}
											></SelectCollectionOption>
										)}
									/>
								</div>

								{isGenerating
									? `Rendering ${batch - count + 1} of ${batch} -- Steps: ${progress} Total: ${displayedResults.length}`
									: `Total: ${displayedResults.length}`}
								<div onClick={onScrollToBottom}>V</div>
							</>
						)}
					</div>

					<div className="flex">
						{displayedResults.map((item: any, index: number) => (
							<div
								className="output-image"
								key={`${index}-${item.filename}-${item.random}`}
							>
								<img
									src={`${COMFY_UI_URL}/view?filename=${item.filename}&type=output&subfolder=${item.subfolder}&rand=${item.random}
          `}
									width="512"
									height="512"
									title={`workflow:${workflow}\nfilename: ${item.filename}\ncollection: ${item.subfolder}\n\ntags: ${item.tags ?? ""}\n(seed: ${item.random})\n\nmodels: ${item.models ?? ""}\n\nloras: ${item.loras ?? ""}`}
									alt={item.filename}
									className="result-image"
								></img>
							</div>
						))}
					</div>
				</div>
				<div className="bottom-half">
					{altWorkflow && (
						<Controls
							workflow={workflows[workflow]}
							workflowName={workflow}
							altWorkflow={altWorkflow}
							setAltWorkflow={setAltWorkflow}
							isGenerating={isGenerating}
							progress={progress}
							count={count}
							batch={batch}
							setBatch={setBatch}
							defaultPromptValue={defaultPromptValue}
							//@ts-ignore
							bookmarkedPrompts={bookmarkedPrompts[currentCollection]}
							setBookmarkedPrompts={setBookmarkedPrompts}
						></Controls>
					)}
					{!workflow && <div>No workflow found</div>}
				</div>
			</div>
		</>
	);
}

export default App;
