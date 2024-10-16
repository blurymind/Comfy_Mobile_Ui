import { useEffect, useRef, useState } from "react";
// import {defineConfig} from 'vite'
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { useLocalStorage } from "./hooks";
import {
	COMFY_UI_URL,
	getWorkflowText,
	load_api_workflows,
	socket,
} from "./utils";
import Controls from "./components/Controls";

// console.log({defineConfig})/
function App() {
	const [count, setCount] = useState<number>(0);
	// const [seed, setSeed] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [workflow, setWorklow] = useState<any>(null);
	const [altWorkflow, setAltWorkflow] = useState(workflow);
	const [loaded, setLoaded] = useState(false);
	const [results, setResults] = useLocalStorage<
		Array<{
			filename: string;
			subfolder: String;
			random: string;
			tags: string;
			loras: string;
			models: string;
		}>
	>("resultsCache", []);
	const [progress, setProgress] = useState(0);
	const [defaultPromptValue, setSufixWorkflowText] = useState(""); // needs to be state
	const resultContainerRef = useRef<HTMLDivElement>(null);

	// from control
	const [promptTags] = useLocalStorage("promptTags", []);

	useEffect(() => {
		load_api_workflows().then((workflows) => {
			console.log({ workflows });
			//@ts-ignore
			const workflowToUse = workflows[0];
			setSufixWorkflowText(getWorkflowText(workflowToUse));
			console.log("SET", { workflowToUse });
			setWorklow(workflowToUse);
			setLoaded(true);
		});
		() => {
			console.log("--- remove --");
		};
	}, []);

	// todo move to utils
	const getLoras = () => {
		const result = Object.values(altWorkflow)
			.filter((item: any) => item.class_type === "LoraLoader")
			.map(
				(item: any) =>
					`${item.inputs.lora_name} (${item.inputs.strength_model})`,
			)
			.join(",\n");
		return result;
	};
	const getModels = () => {
		const result = Object.values(altWorkflow)
			.filter((item: any) => item.class_type.startsWith("CheckpointLoader"))
			.map((item: any) => `${item.inputs.ckpt_name.split(".")[0]}`)
			.join(",\n");
		return result;
	};
	useEffect(() => {
		if (workflow == null) return;
		setAltWorkflow(workflow);
		console.log("-------------------------------------------DO----");
		socket.addEventListener("open", (event) => {
			console.log("============ Connected to the server", { event });
		});
		console.log("========= ADD LISTENER");
		const onMessage = (event: any) => {
			const data = JSON.parse(event.data);
			console.log("---", data);
			if (data.type === "progress") {
				// setIsGenerating(true);
				setProgress(data["data"]["max"] - data["data"]["value"]);
				console.info(data["data"]["max"], data["data"]["value"]);

				// updateProgress(data['data']['max'], data['data']['value']);
			} else if (data.type === "executed" && count === 0 && !isGenerating) {
				const execution_time = 22; //elapsedTime();
				console.log("Execution time: " + execution_time + "s", {
					isGenerating,
					progress,
				});
				if ("images" in data["data"]["output"]) {
					const imageData = data["data"]["output"]["images"];
					if (imageData[0]?.type === "temp") {
						console.log(" -- SKIP --");
						return;
					}
					console.log({ imageData, results, isGenerating });
					const loras = getLoras();
					const models = getModels();
					setResults((prev) => [
						...(prev ?? []),
						...imageData
							.filter(
								(item: any) => !item.filename.toLowerCase().includes("_temp_"),
							)
							.map((item: any) => ({
								filename: item.filename,
								subfolder: item.subfolder,
								random: Math.random(),
								tags: promptTags.map((item: any) => item.value).join(","),
								models,
								loras,
							})),
					]);
					setIsGenerating(false);
					setTimeout(() => {
						if (resultContainerRef.current) {
							resultContainerRef.current.scrollTop =
								resultContainerRef.current.scrollHeight;
							// resultContainerRef.current.click();
						}
					}, 500);
				}
			} else if (data.type === "execution_interrupted") {
				console.log("Execution Interrupted");
				setCount(data["data"]["status"]["exec_info"]["queue_remaining"]);
			} else if (data.type === "status") {
				console.log({ data });
				const remaining =
					data["data"]["status"]["exec_info"]["queue_remaining"];
				setIsGenerating(remaining > 0 ? true : false);
				setCount(remaining);
			}
		};
		socket.addEventListener("message", onMessage);
	}, [loaded]);

	return (
		<>
			<div className="layout-wrapper" id="app-root">
				<div className="flex top-half" ref={resultContainerRef}>
					{(results ?? []).map((item) => (
						<div className="output-image" key={item.random}>
							<img
								src={`${COMFY_UI_URL}/view?filename=${item.filename}&type=output&subfolder=${item.subfolder}&rand=${item.random}
          `}
								width="512"
								height="512"
								title={`tags: ${item.tags}\n(seed: ${item.random})\n\nmodels: ${item.models}\n\nloras: ${item.loras}`}
								alt={item.filename}
								className="result-image"
							></img>
						</div>
					))}
				</div>
				<div className="bottom-half">
					{altWorkflow && (
						<Controls
							workflow={workflow}
							altWorkflow={altWorkflow}
							setAltWorkflow={setAltWorkflow}
							isGenerating={isGenerating}
							progress={progress}
							count={count}
							defaultPromptValue={defaultPromptValue}
						></Controls>
					)}
					{!workflow && <div>No workflow found</div>}
				</div>

				{/* <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
			</div>
			{/* <input type="search"></input> */}
		</>
	);
}

export default App;
