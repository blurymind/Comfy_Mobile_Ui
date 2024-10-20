from .mobile import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
import os
import server
import folder_paths
from aiohttp import web
import json

ROOT_FOLDER = os.path.dirname(os.path.realpath(__file__))
WEBROOT = os.path.join(ROOT_FOLDER, "comfyui-mobile-console", "dist")
WORKFLOW_COLLECTION = os.path.join(ROOT_FOLDER, "workflow-apis")
FIREPLACE_UI_PUBLIC = os.path.join(ROOT_FOLDER, "comfyui-mobile-console", "public")

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
    debug_file = os.path.join(FIREPLACE_UI_PUBLIC, "workflows.json")
    print(f'--- dumping debug file at: {debug_file}: contents: {result}')
    with open(debug_file, "w") as file:
        json.dump(result, file)
    return web.json_response(result)

# https://github.com/BennyKok/comfyui-deploy/blob/main/custom_routes.py
@server.PromptServer.instance.routes.get("/comfyui-deploy/models")
async def get_installed_models(request):
    new_dict = {}
    for key, value in folder_paths.folder_names_and_paths.items():
        file_list = folder_paths.get_filename_list(key)
        value_json_compatible = (value[0], list(value[1]), file_list)
        new_dict[key] = value_json_compatible
    return web.json_response(new_dict)


server.PromptServer.instance.routes.static("/fireplace", WEBROOT)
# server.PromptServer.instance.routes.static("/fireplace/workflows", path=os.path.join(FIREPLACE, "workflows"))
# server.PromptServer.instance.routes.static("/fireplace/assets", WEBROOT)
# can run from Krita with 
# source ~/.local/share/krita/ai_diffusion/server/venv/bin/activate && python ./main.py --listen 0.0.0.0 --enable-cors-header '*'

# https://docs.comfy.org/essentials/comms_routes

COMFY_OUTPUTS = os.path.join(os.path.dirname(os.path.dirname(ROOT_FOLDER)), 'output')
server.PromptServer.instance.routes.static("/fireplace/outputs", WEBROOT)
@server.PromptServer.instance.routes.post("/fireplace/fs")
async def get_fs_info(request):
    print(f'REQUESTED FS DATA :: {request}')
    outpus_directories = {}
    for path in os.listdir(COMFY_OUTPUTS):
        if not os.path.isfile(path):
            print(f'---path: {path}')
            path_files = []
            try:
                subfolder = os.path.join(COMFY_OUTPUTS, path)
                for file_name in os.listdir(subfolder):
                    path_files.append({"file_name": file_name, "path": os.path.join(subfolder, file_name) })
            except:
                print(f'Couldnt get files for {subfolder}')
            if len(path_files) > 0:
                outpus_directories[path] = {}
                outpus_directories[path] = path_files
    return web.json_response(outpus_directories)

@server.PromptServer.instance.routes.get("/fireplace/fs-make")
async def fs_make_dir(request):
    pass

print(f' --- COMFY folder: {COMFY_OUTPUTS}')

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']


