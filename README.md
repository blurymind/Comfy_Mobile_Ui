## About
Cozy fireplace is a ComfyUI workflow prompter that brings a localhost server frontend for existing workflows created in ComfyUi.
Just place your favorite or lovingly crafted workflows in a folder and cozy fireplace will let you select and run any of them (export them as API type in comfyui)
It's a cozy UI that scales all the way down to mobile phone devices - to let you prompt your beefy pc at home with your smartphone.

You may say that this has been done before, but this one is a bit more than the others, as it focuses on bringing a nice workflow for creating, testing and storing prompts from before.

## Features
- Written in React with usability in mind - to improve the process of crafting prompts that are sent to be rendered to a workflow. Easy and intuitive access on any device from anywhere in your local network.
- Extensive prompt editor that lets you use a tagging system instead of just the usual basic text field (yuck). The end result is in the end still a string that concatinates them with commas between each tag.
- You can save tags (a tag can be a keyword or an entire sentence) and combine them in different ways. You can bookmark previously succesful tag combinations and reuse them any time.
- The UI makes sure that tags are easy to search and bookmarks are not getting duplicated as you add new ones.
- Your positive and Negative prompts can be separated from your main query promtps- so you can persist them as part of the workflow file that is loaded. You can still edit them, but they are in a different tab and they get added after your main prompt query.
- The render and preview button is right under your finger, you dont have to keep panning around a big and complicated canvas to try prompts out
- Prompt results can be bookmarked or deleted similar to how krita lets you do it. You can re-view them at any point, organised by collection via the workflow name.
- Batch render - this lets you tell comfyui to render a query setup many times and it also reports progress as it goes - populating the results view in a scrollable view. Kind of like the instagram of AI.
- Rendered images are displayed with stored informatiom of the model, loras, seed and prompt used to generate them. Ultimately as much info as possible to replicate.
- Designed to make use of every pixel of your phone, while also offering tons of functionality without being cluttered.

# What this is not for
- Creating new workflows. It can override the loaded workflow's node parameters to a degree - but you cannot use it to add, remove or connect nodes. And at the moment only specific key nodes can receive parameters before you render
- If you need to craft a workflow, you should still do it in comfy. This is for crafting prompts and passing some parameters to existing workflows.

## Installation
go to comfyUI's `custom_nodes` folder and download or git clone this repository in the ComfyUI.
Spin up comfyUI.
You then can access it going to the URL: `http://[comfy address]:[comfy port]/fireplace`. Eg: `http://127.0.0.1:8188/fireplace`

Note that you need to export your comfyui workflow to
 `cozy-fireplace/comfyui-mobile-console/public/workflows/default.json`

 The application requires that workflow to have at least one positive (not starting with the word "negative") `CLIPTextEncode` and at least one output node. For now it can only output images. Test your workflow in comfyui before trying to load it in this app and make sure it outputs an image.
 Make sure that you export it as API json file.

## Access Comfy MobileUI from your network
Running ComfyUI with the `--listen 0.0.0.0 --enable-cors-header '*'` options will let you run the application from any device in your local network. **Caution!** this might open your ComfyUI installation to the whole network and/or the internet if the PC that runs Comfy is opened to incoming connection from the outside. This is not usually the case as most home routers don't allow direct connection from the outside but you need to know what you are doing.


## How could Comfy MobileUI evolve
- todo
