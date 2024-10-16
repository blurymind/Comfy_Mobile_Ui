**IMPORTANT:** At the moment this is mostly a tech demo to show how to build a web app on top of ComfyUI.
## Installation

Download or git clone this repository in the ComfyUI `.../ComfyUI/custom_nodes` directory. You then can access it going to the URL: `http://[comfy address]:[comfy port]/mobile`. Eg: `http://127.0.0.1:8188/mobile`

Note that you need to export your comfyui workflow to
 `Comfy_Mobile_Ui/comfyui-mobile-console/public/workflows/default.json`

 The application requires that workflow to have at least one positive (not starting with the word "negative") `CLIPTextEncode` and at least one output node. For now it can only output images. Test your workflow in comfyui before trying to load it in this app and make sure it outputs an image.
 Make sure that you export it as API json file.

## Access Comfy MobileUI from your network
Running ComfyUI with the `--listen 0.0.0.0 --enable-cors-header '*'` options will let you run the application from any device in your local network. **Caution!** this might open your ComfyUI installation to the whole network and/or the internet if the PC that runs Comfy is opened to incoming connection from the outside. This is not usually the case as most home routers don't allow direct connection from the outside but you need to know what you are doing.



## How could Comfy MobileUI evolve
- todo
