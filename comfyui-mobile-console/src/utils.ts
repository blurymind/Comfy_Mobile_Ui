export const COMFY_UI_PORT = 8188;
export const COMFY_UI_URL = `http://${window.location.hostname}:${COMFY_UI_PORT}`;
export const seed = () => {
	return Math.floor(Math.random() * 9999999999);
};
//@ts-ignore
export const uuidv4 = () => {
	//@ts-ignore
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
		/[018]/g,
		//@ts-ignore
		(c) =>
			(
				c ^
				(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
			).toString(16),
	);
};
export const CLIENT_ID = uuidv4();
export const SERVER_ADDRESS = window.location.hostname + ":" + COMFY_UI_PORT;
export const PROMPT_TIME = 1000;
export const load_api_workflows = () => {
	let wf = {
		"0": "/workflows/default.json",
	} as any;
	const promises: any = [];
	for (let key in wf) {
		// let response = await fetch(wf[key]);
		// wf[key] = await response.json();
		promises.push(fetch(wf[key]).then((res) => res.json()));
	}
	return Promise.all(promises);
	// todo get it from ComfyUI/user/default/comfy.templates.json
	// return wf;
};
export const PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
export const socket = new WebSocket(
	PROTOCOL + "//" + SERVER_ADDRESS + "/ws?clientId=" + CLIENT_ID,
);

export const queue_prompt = async (prompt = {}) => {
	const data = { prompt: prompt, client_id: CLIENT_ID };

	console.log({ data });
	const response = await fetch(`http://${SERVER_ADDRESS}/prompt`, {
		method: "POST",
		cache: "no-cache",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	return await response.json();
};
// @ts-ignore
export const getWorkflowPromptNode = (workflow: any): any => {
	const node = Object.entries(workflow).find(([_, node]) => {
		if (
			//@ts-ignore
			node.class_type === "CLIPTextEncode" &&
			//@ts-ignore
			!node.inputs.text.toLowerCase().startsWith("negative")
		) {
			//   key = nodeKey;
			return true;
		}
		return false;
	});
	return node;
};

// @ts-ignore
export const getSeedNode = (workflow: any): any => {
	return Object.entries(workflow).find(([_, node]) => {
		if (
			//@ts-ignore
			node.class_type === "RandomNoise" &&
			//@ts-ignore
			"noise_seed" in node.inputs
		) {
			return true;
		}
		return false;
	});
};

export const getMutatedWorkflow = (workflow: any, prompt: string) => {
	const [textNodeKey, textNode] = getWorkflowPromptNode(workflow);
	const [seedNodeKey] = getSeedNode(workflow);
	console.log({ textNode });
	return {
		...workflow,
		[textNodeKey]: {
			...workflow[textNodeKey],
			inputs: { ...workflow[textNodeKey].inputs, text: prompt },
		},
		[seedNodeKey]: {
			...workflow[seedNodeKey],
			inputs: { ...workflow[seedNodeKey].inputs, noise_seed: seed() },
		},
	};
};
export const getWorkflowText = (workflow: any) => {
	const [_, workflowNode] = getWorkflowPromptNode(workflow);
	console.log({ workflowNode });
	if (!workflowNode) return "";
	//@ts-ignore
	return workflowNode.inputs.text;
};
export const getInput = (query: string, sufixWorkflowText: string) => {
	return query.replace(/(\r\n|\n|\r|\")/gm, " ") + "," + sufixWorkflowText;
};
