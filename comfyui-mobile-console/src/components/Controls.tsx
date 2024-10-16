import { useMemo } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { getSeedNode, getWorkflowText, queue_prompt, seed } from "../utils";
import { textRenderer } from "./input-renderers";
import { useLocalStorage } from "../hooks";

const CONTROLERS: any = {
	CLIPTextEncode: {
		//@ts-ignore
		has: (node) => !node.inputs.text.toLowerCase().startsWith("negative"),
		inputs: [
			{
				path: "text",
				renderer: textRenderer,
			},
		],
		key: null,
	},
	LoraLoader: {
		has: () => false, //todo
		inputs: [
			{ path: "strength_clip" },
			{ path: "strength_model" },
			{ path: "lora_name" },
		],
		key: null,
	},
	ImageScale: {
		has: () => true,
		inputs: [
			{ path: "crop" },
			{ path: "upscale_method" },
			{ path: "width" },
			{ path: "height" },
		],
		key: null,
	},
};
const getControllers = (workflow: any) => {
	if (!workflow) return [];
	const result: Array<any> = [];
	const inputLabels: Array<string> = [];
	Object.keys(workflow).forEach((key) => {
		const node = workflow[key];
		const nodeType = node.class_type;
		if (nodeType in CONTROLERS) {
			//@ts-ignore
			const shouldAdd = CONTROLERS[nodeType].has(node);
			if (!shouldAdd) return;

			const inputs = CONTROLERS[nodeType].inputs.map((input: any) => {
				return {
					...input,
					value: node.inputs[input.path],
					key,
					path: input.path,
				};
			});
			inputLabels.push(nodeType);
			result.push({
				node,
				key,
				inputs,
				title: node._meta,
				nodeType,
			});
		}
	});
	return [inputLabels, result];
};

export interface Props {
	workflow: any;
	defaultPromptValue: string;
	isGenerating: boolean;
	progress: number;
	count: number;
	altWorkflow: any;
	setAltWorkflow: any;
}
export default ({
	workflow,
	isGenerating,
	progress,
	count,
	defaultPromptValue,
	altWorkflow,
	setAltWorkflow,
}: Props) => {
	const [batch, setBatch] = useLocalStorage("batchCount", 1);
	const suffixTags = useMemo(() => getWorkflowText(workflow), [workflow]);
	console.log({ altWorkflow });
	const [inputLabels, inputData] = useMemo(
		() => getControllers(altWorkflow),
		[altWorkflow, suffixTags],
	);

	const onSetInput = (input: any) => (newValue: any) => {
		setAltWorkflow((prev: any) => ({
			...prev,
			[input.key]: {
				//which node
				...prev[input.key],
				inputs: {
					// which input
					...prev[input.key].inputs,
					[input.path]: newValue,
				},
			},
		}));
	};
	const onRender = () => {
		const [seedNodeKey] = getSeedNode(altWorkflow);
		for (let step = 0; step < batch; step++) {
			const random = seed();
			queue_prompt({
				...altWorkflow,
				[seedNodeKey]: {
					...altWorkflow[seedNodeKey],
					inputs: {
						...altWorkflow[seedNodeKey].inputs,
						noise_seed: random,
					},
				},
			});
		}
	};
	return (
		<div className="flex" id="app-controls">
			<Tabs className="tabs">
				<TabList>
					{inputLabels.map((input, index) => (
						<Tab key={index}>{input}</Tab>
					))}
				</TabList>
				<div className="flex">
					{inputData.map((item, index) => {
						//todo make sub component?
						return (
							<TabPanel className="tab-panel" key={`${index}`}>
								{item.inputs.map((input: any, inpIndex: number) => {
									if (input.renderer) {
										return input.renderer(
											input,
											onSetInput(input),
											inpIndex,
											defaultPromptValue,
										);
									}
									return null;
								})}
							</TabPanel>
						);
					})}
				</div>
			</Tabs>
			{isGenerating && <div>{progress}</div>}
			<div>
				<div className="render-button">
					{count > 0 ? (
						`Rendering ${batch - count + 1} of ${batch}`
					) : (
						<>
							<button onClick={onRender} disabled={!workflow || isGenerating}>
								{`Render`}
							</button>
							<input
								value={batch}
								type="number"
								onChange={(e) => setBatch(Number(e.target.value))}
								style={{ maxWidth: 30 }}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
