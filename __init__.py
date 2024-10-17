from .mobile import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

import os
import server
import folder_paths
from aiohttp import web
import json

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "comfyui-mobile-console", "dist")
FIREPLACE = os.path.dirname(os.path.realpath(__file__))
WORKFLOW_COLLECTION = os.path.join(os.path.dirname(os.path.realpath(__file__)), "workflows")

@server.PromptServer.instance.routes.get("/fireplace")
def fireplace(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

@server.PromptServer.instance.routes.get("/fireplace/workflows.json")
def fp_workflows(request):
    filenames = next(os.walk(WORKFLOW_COLLECTION), (None, None, []))[2]
    print(f'FILES: {filenames}')
    result = {}
    for filename in filenames:
        if filename.endswith('.json'):
            with open(os.path.join(WORKFLOW_COLLECTION, filename)) as file:
                data = json.load(file)
                result[filename] = data
    return web.json_response(result)

@server.PromptServer.instance.routes.get("/comfyui-deploy/models")
async def get_installed_models(request):
    # Directly return the list of paths as JSON
    new_dict = {}
    for key, value in folder_paths.folder_names_and_paths.items():
        # Convert set to list for JSON compatibility
        # for path in value[0]:
        file_list = folder_paths.get_filename_list(key)
        value_json_compatible = (value[0], list(value[1]), file_list)
        new_dict[key] = value_json_compatible
    # logger.info(new_dict)
    return web.json_response(new_dict)

# print("--- WEBROOT: " + WEBROOT)
# print("--- ROOT: " + APPROOT)
server.PromptServer.instance.routes.static("/fireplace", WEBROOT)
# server.PromptServer.instance.routes.static("/fireplace/workflows", path=os.path.join(FIREPLACE, "workflows"))
# server.PromptServer.instance.routes.static("/fireplace/assets", WEBROOT)
# can run from Krita with 
# source ~/.local/share/krita/ai_diffusion/server/venv/bin/activate && python ./main.py --listen 0.0.0.0 --enable-cors-header '*'
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']


