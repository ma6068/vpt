// #part /js/Application

// #link utils
// #link readers
// #link loaders
// #link dialogs
// #link ui
// #link RenderingContext

class Application {

constructor() {
    this._handleFileDrop = this._handleFileDrop.bind(this);
    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleVolumeLoad = this._handleVolumeLoad.bind(this);
    this._handleEnvmapLoad = this._handleEnvmapLoad.bind(this);
    this._handleTemporalLoad = this._handleTemporalLoad.bind(this);

    this._renderingContext = new RenderingContext();
    this._canvas = this._renderingContext.getCanvas();
    this._canvas.className += 'renderer';
    document.body.appendChild(this._canvas);

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderingContext.resize(width, height);
    });
    window.dispatchEvent(new Event('resize'));

    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', this._handleFileDrop);

    this._mainDialog = new MainDialog();
    if (!this._renderingContext.hasComputeCapabilities()) {
        this._mainDialog.disableMCC();
    }

    this._statusBar = new StatusBar();
    this._statusBar.appendTo(document.body);

    this._volumeLoadDialog = new VolumeLoadDialog();
    this._volumeLoadDialog.appendTo(this._mainDialog.getVolumeLoadContainer());
    this._volumeLoadDialog.addEventListener('load', this._handleVolumeLoad);

    this._envmapLoadDialog = new EnvmapLoadDialog();
    this._envmapLoadDialog.appendTo(this._mainDialog.getEnvmapLoadContainer());
    this._envmapLoadDialog.addEventListener('load', this._handleEnvmapLoad);

    this._temporalLoadDialog = new TemporalLoadDialog();
    this._temporalLoadDialog.appendTo(this._mainDialog.getTemporalLoadContainer());
    this._temporalLoadDialog.addEventListener('load', this._handleTemporalLoad)

    this._renderingContextDialog = new RenderingContextDialog();
    this._renderingContextDialog.appendTo(
        this._mainDialog.getRenderingContextSettingsContainer());
    this._renderingContextDialog.addEventListener('resolution', e => {
        const resolution = this._renderingContextDialog.resolution;
        this._renderingContext.setResolution(resolution);
    });
    this._renderingContextDialog.addEventListener('transformation', e => {
        const s = this._renderingContextDialog.scale;
        const t = this._renderingContextDialog.translation;
        this._renderingContext.setScale(s.x, s.y, s.z);
        this._renderingContext.setTranslation(t.x, t.y, t.z);
    });
    this._renderingContextDialog.addEventListener('filter', e => {
        const filter = this._renderingContextDialog.filter;
        this._renderingContext.setFilter(filter);
    });

    this._mainDialog.addEventListener('rendererchange', this._handleRendererChange);
    this._mainDialog.addEventListener('tonemapperchange', this._handleToneMapperChange);
    this._handleRendererChange();
    this._handleToneMapperChange();
}

_handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) {
        return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.bvp')) {
        throw new Error('Filename extension must be .bvp');
    }
    this._handleVolumeLoad(new CustomEvent('load', {
        detail: {
            type       : 'file',
            file       : file,
            filetype   : 'bvp',
            dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
            precision  : 8, // doesn't matter
        }
    }));
}

_handleRendererChange() {
    if (this._rendererDialog) {
        this._rendererDialog.destroy();
    }
    const which = this._mainDialog.getSelectedRenderer();
    this._renderingContext.chooseRenderer(which);
    const renderer = this._renderingContext.getRenderer();
    const container = this._mainDialog.getRendererSettingsContainer();
    const dialogClass = this._getDialogForRenderer(which);
    this._rendererDialog = new dialogClass(renderer);
    this._rendererDialog.appendTo(container);
}

_handleToneMapperChange() {
    if (this._toneMapperDialog) {
        this._toneMapperDialog.destroy();
    }
    const which = this._mainDialog.getSelectedToneMapper();
    this._renderingContext.chooseToneMapper(which);
    const toneMapper = this._renderingContext.getToneMapper();
    const container = this._mainDialog.getToneMapperSettingsContainer();
    const dialogClass = this._getDialogForToneMapper(which);
    this._toneMapperDialog = new dialogClass(toneMapper);
    this._toneMapperDialog.appendTo(container);
}

_handleVolumeLoad(e) {
    const options = e.detail;
    if (options.type === 'file') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new BlobLoader(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader, 'default');
        }
    } else if (options.type === 'url') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new AjaxLoader(options.url);
            const reader = new readerClass(loader);
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader, 'default');
        }
    }
}

_handleTemporalLoad(e) {
    const options = e.detail;
    if (options.type === 'file') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new BlobLoader(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader, String(document.current_input));
        }
    } else if (options.type === 'url') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new AjaxLoader(options.url);
            const reader = new readerClass(loader);
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader, String(document.current_input));
        }
    }
}

_handleEnvmapLoad(e) {
    const options = e.detail;
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this._renderingContext.setEnvironmentMap(image);
        this._renderingContext.getRenderer().reset();
    });

    if (options.type === 'file') {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            image.src = reader.result;
        });
        reader.readAsDataURL(options.file);
    } else if (options.type === 'url') {
        image.src = options.url;
    }
}

_getReaderForFileType(type) {
    switch (type) {
        case 'bvp'  : return BVPReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
    }
}

_getDialogForRenderer(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRendererDialog;
        case 'iso' : return ISORendererDialog;
        case 'eam' : return EAMRendererDialog;
        case 'mcs' : return MCSRendererDialog;
        case 'mcm' : return MCMRendererDialog;
        case 'mcc' : return MCMRendererDialog; // yes, the same
        case 'dos' : return DOSRendererDialog;
    }
}

_getDialogForToneMapper(toneMapper) {
    switch (toneMapper) {
        case 'artistic'   : return ArtisticToneMapperDialog;
        case 'range'      : return RangeToneMapperDialog;
        case 'reinhard'   : return ReinhardToneMapperDialog;
        case 'reinhard2'  : return Reinhard2ToneMapperDialog;
        case 'uncharted2' : return Uncharted2ToneMapperDialog;
        case 'filmic'     : return FilmicToneMapperDialog;
        case 'unreal'     : return UnrealToneMapperDialog;
        case 'aces'       : return AcesToneMapperDialog;
        case 'lottes'     : return LottesToneMapperDialog;
        case 'uchimura'   : return UchimuraToneMapperDialog;
    }
}

}
