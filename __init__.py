import glob
from .mobile import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
import os
import server
import folder_paths
from aiohttp import web
import json
from PIL import Image
from PIL.ExifTags import TAGS

ROOT_FOLDER = os.path.dirname(os.path.realpath(__file__))
TAGS_FOLDER = os.path.join(ROOT_FOLDER, "tags")
WEBROOT = os.path.join(ROOT_FOLDER, "frontend", "dist")
WORKFLOW_COLLECTION = os.path.join(ROOT_FOLDER, "workflow-apis")
FIREPLACE_UI_PUBLIC = os.path.join(ROOT_FOLDER, "frontend", "public")

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
@server.PromptServer.instance.routes.get("/fireplace/fs") # use post to request specific data
async def get_fs_info(request):
    print(f'REQUESTED FS DATA :: {request}')
    outpus_directories = {}
    prompts = {}
    subfolders = [ f.path for f in os.scandir(COMFY_OUTPUTS) if f.is_dir() ]
    for subfolder in subfolders:
        print(f'---path: {subfolder}')
        path_files = []
        dir_name = os.path.basename(subfolder)
        try:
            # print(f'-- SUBF: {subfolder}')
            os.chdir(subfolder)
            files = sorted(filter(os.path.isfile, os.listdir('.')), key=os.path.getmtime)
            # print(f'-----> FILES {files}')
            for file_name in files:                
                # with Image.open(os.path.join(subfolder, file_name)) as image:
                #     exifdata = image.getexif()
                #     for tag_id in exifdata:
                #         # get the tag name, instead of human unreadable tag id
                #         tag = TAGS.get(tag_id, tag_id)
                #         data = exifdata.get(tag_id)
                #         # decode bytes 
                #         if isinstance(data, bytes):
                #             data = data.decode()
                #         print(f"{tag:25}: {data}")
                # print(f'file ---------- {file_name}')
                if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif')):
                    path_files.append({"filename": file_name, "path": os.path.join(subfolder, file_name), "subfolder": dir_name })

        except:
            print(f'Couldnt get files for {subfolder}')
        print(f'=== DIR NAME: {dir_name}')
        outpus_directories[dir_name] = {}
        outpus_directories[dir_name] = path_files

        prompts_file_path = os.path.join(subfolder, 'prompts.json')
        try:
            with open(prompts_file_path, 'r') as prompts_file:
                prompt_data = json.load(prompts_file)
                prompts[dir_name] = prompt_data
                print(f'-> loaded prompt data: {dir_name}: {prompt_data}')
        except:
            print(f'File does not exist {prompts_file_path}')

    return web.json_response({"files": outpus_directories, "prompts": prompts})

@server.PromptServer.instance.routes.get("/fireplace/fs-make")
async def fs_make_dir(request):
    pass

@server.PromptServer.instance.routes.post("/fireplace/fs-update-bookmarks")
async def fs_update_bookmarks(request):
    result = {}
    json_content =  await request.json()
    action = json_content['action'] #add/remove/update
    key = json_content['key']
    data = json_content['value']
    subfolder = json_content['collection']
    
    prompts_file_path = os.path.join(COMFY_OUTPUTS, subfolder, 'prompts.json')
    print(f'prompts file: {prompts_file_path} -- action {action} --key {key} --collection {subfolder}')
    if not os.path.exists(prompts_file_path):
        print(f'{prompts_file_path} file is empty or missing!')
        result[key] = {}
        with open(prompts_file_path, "w") as file:
            print(f'CREATE -- NEW CONTENT: {result}')
            json.dump(result, file)
            file.close()

    old_contents = {}
    # return web.json_response(result) # the new data
    with open(prompts_file_path) as file:
        try:
            old_contents = json.load(file)
            result.update(old_contents)
        except:
            print(f'Failed to load json from {prompts_file_path}')

    with open(prompts_file_path, 'w') as file:   
        result[key] = data
        json.dump(result, file)
        result = result
        file.close()
    return web.json_response(result) # the new data

@server.PromptServer.instance.routes.post("/fireplace/fs-move")
async def fs_move_to_dir(request):
    json_content =  await request.json()
    subfolder = json_content['subfolder']
    files = json_content['files']
    workflow = json_content['workflow']
    new_files = {}
    for file in files.values():
        old_filename = file['filename']
        filename, file_extension = os.path.splitext(old_filename)
        new_filename = os.path.splitext(workflow)[0] + '-' + str(file['random']) + '-' + filename + file_extension
        file_path = os.path.join(COMFY_OUTPUTS, old_filename)
        move_to = os.path.join(COMFY_OUTPUTS, subfolder, new_filename)
        # print(f'file data: path: {file_path} --> {move_to}')
        new_files[new_filename] = {**file, "filename": new_filename}
        os.rename(file_path, move_to)
    print(f'-- NEW FILES: {new_files}')
    return web.json_response(new_files)

@server.PromptServer.instance.routes.post("/fireplace/fs-create")
async def fs_create_dir(request):
    json_content =  await request.json()
    collection = json_content['collection']
    directory = os.path.join(COMFY_OUTPUTS, collection)
    if not os.path.exists(directory):
        os.makedirs(directory)
    return web.json_response({})

@server.PromptServer.instance.routes.post("/fireplace/fs-rename")
async def fs_rename_dir(request):
    json_content =  await request.json()
    rename_from = json_content['from']
    rename_to = json_content['to']
    os.rename(os.path.join(COMFY_OUTPUTS, rename_from), os.path.join(COMFY_OUTPUTS, rename_to))
    return web.json_response({})

@server.PromptServer.instance.routes.post("/fireplace/fs-rename-file")
async def fs_rename_file(request):
    json_content =  await request.json()
    rename_from = json_content['from']
    rename_to = json_content['to']
    collection  = json_content['collection']
    print(f'--- Renaming file in {collection}: {rename_from} to {rename_to} --')
    os.rename(os.path.join(COMFY_OUTPUTS, collection, rename_from), os.path.join(COMFY_OUTPUTS, collection, rename_to))
    return web.json_response({})

@server.PromptServer.instance.routes.post("/fireplace/fs-delete")
async def fs_delete_dir(request):
    json_content =  await request.json()
    name = json_content['file']
    collection = json_content['collection']
    path = os.path.join(COMFY_OUTPUTS, collection, name)
    if os.path.isfile(path):
        print(f'Removing FILE at {path}')
        os.remove(path)
    else:
        print(f'Removing FOLDER at {path}')
        os.rmdir(path)
    return web.json_response({})

@server.PromptServer.instance.routes.get("/fireplace/fs-tags.json")
async def fs_load_tags(request): #loads all immutable tags
    result = {}
    tag_files = [ f.path for f in os.scandir(TAGS_FOLDER) if f.is_file() ]
    for filename in tag_files:
        if filename.endswith('.csv'):
            result_tags = set()
            with open(filename) as file:
                for line in file:
                    new_tag = line.split(',')[0]
                    result_tags.add(new_tag)
            result[os.path.basename(filename)] = list(result_tags)
    return web.json_response(result)
print(f' --- COMFY folder: {COMFY_OUTPUTS}')
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']


