// #part /js/main

// #link Application
// #link ResourceLoader

const resources = {
    shaders: {
        type: 'json',
        url: 'glsl/shaders.json'
    },
    mixins: {
        type: 'json',
        url: 'glsl/mixins.json'
    },
    templates: {
        type: 'json',
        url: 'html/templates.json'
    },
    uispecs: {
        type: 'json',
        url: 'uispecs.json'
    },
    all: {
        type: 'dummy',
        dependencies: [
            'shaders',
            'mixins',
            'templates',
            'uispecs'
        ]
    }
};

// TODO: fix this quick hack to load all resources into the old globals
ResourceLoader.instance = new ResourceLoader(resources);

let SHADERS;
let MIXINS;
let TEMPLATES;
let UISPECS;

document.time_error_spinner = 500;
document.is_playing = false;
document.current_input = 0;
document.max_input_data  = 1;
document.current_error = 3;  // set to max value
document.time_or_error = 'timeValue';   // mozni vrednosti: timeValue / errorValue
document.temporal_images = [];

document.addEventListener('DOMContentLoaded', async () => {
    const rl = ResourceLoader.instance;
    [ SHADERS, MIXINS, TEMPLATES, UISPECS ] = await Promise.all([
        rl.loadResource('shaders'),
        rl.loadResource('mixins'),
        rl.loadResource('templates'),
        rl.loadResource('uispecs'),
    ]);
    const application = new Application();
});
