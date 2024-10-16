from .mobile import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

import os
import server
from aiohttp import web

# WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")
WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "comfyui-mobile-console/dist")

@server.PromptServer.instance.routes.get("/mobile")
def deungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

#server.PromptServer.instance.routes.static("/mobile/css/", path=os.path.join(WEBROOT, "css"))
#server.PromptServer.instance.routes.static("/mobile/js/", path=os.path.join(WEBROOT, "js"))

server.PromptServer.instance.routes.static("/mobile/assets", path=os.path.join(WEBROOT, "assets"))
server.PromptServer.instance.routes.static("/mobile/workflows", path=os.path.join(WEBROOT, "workflows"))
server.PromptServer.instance.routes.static("/", WEBROOT)
# can run from Krita with 
# source ~/.local/share/krita/ai_diffusion/server/venv/bin/activate && python ./main.py --listen 0.0.0.0 --enable-cors-header '*'
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']


