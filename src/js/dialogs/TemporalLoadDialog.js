// #part /js/dialogs/TemporalLoadDialog

// #link AbstractDialog

// #link /uispecs/TemporalLoadDialog

class TemporalLoadDialog extends AbstractDialog {

    constructor(options) {
        super(UISPECS.TemporalLoadDialog, options);
    
        this._handleTypeChange = this._handleTypeChange.bind(this);
        this._handleLoadClick = this._handleLoadClick.bind(this);
        this._handleFileChange = this._handleFileChange.bind(this);
        this._handleURLChange = this._handleURLChange.bind(this);
        this._handleDemoChange = this._handleDemoChange.bind(this);

        // Dodadeno
        this._handleRenderType = this._handleRenderType.bind(this);
        this._handleFrameSpinner = this._handleFrameSpinner.bind(this);
        this._handleFrameSlider = this._handleFrameSlider.bind(this);
        this._handlePreviousButton = this._handlePreviousButton.bind(this);
        this._handlePlayButton = this._handlePlayButton.bind(this);
        this._handleNextButton = this._handleNextButton.bind(this);
        this._handleTimeErrorSpinner = this._handleTimeErrorSpinner.bind(this);
        this._updateCurrentVolume = this._updateCurrentVolume.bind(this);
        // Dodadeno kraj

        this._demos = [];
    
        this._addEventListeners();
        this._loadDemoJson();
    }

    _addEventListeners() {
        this._binds.type.addEventListener('change', this._handleTypeChange);
        this._binds.loadButton.addEventListener('click', this._handleLoadClick);
        this._binds.file.addEventListener('change', this._handleFileChange);
        this._binds.url.addEventListener('input', this._handleURLChange);
        this._binds.demo.addEventListener('change', this._handleDemoChange);

        // Dodadeno 
        this._binds.renderType.addEventListener('change', this._handleRenderType);
        this._binds.previousButton.addEventListener('click', this._handlePreviousButton);
        this._binds.playButton.addEventListener('click', this._handlePlayButton);
        this._binds.nextButton.addEventListener('click', this._handleNextButton);
        this._binds.frameSlider.addEventListener('change', this._handleFrameSlider);
        this._binds.frameSpinner.addEventListener('change', this._handleFrameSpinner);
        this._binds.timeErrorSpinner.addEventListener('change', this._handleTimeErrorSpinner);
        // Dodadeno kraj
    }

    _handleRenderType() {
        document.time_or_error = this._binds.renderType.getValue();
        document.is_playing = false;
        this._binds.playButton.setLabelValue('Play');
        window.clearInterval(document.time_error_interval);
        if (document.time_or_error == 'timeValue') {
            this._binds.timeErrorLabel.setLabelValue('Milliseconds:');
            this._binds.timeErrorSpinner.setValue(500);
            this._binds.timeErrorSpinner.setMinValue(500);
            this._binds.timeErrorSpinner.setMaxValue(5000);
            this._binds.timeErrorSpinner.setStepValue(1000);
            document.time_error_spinner = 500;
        }
        else {
            this._binds.timeErrorLabel.setLabelValue('Threshold:');
            this._binds.timeErrorSpinner.setValue(0.2);
            this._binds.timeErrorSpinner.setMinValue(0);
            this._binds.timeErrorSpinner.setMaxValue(3);
            this._binds.timeErrorSpinner.setStepValue(0.1);
            document.time_error_spinner = 0.2;
        }
    }

    _handleFrameSpinner() {
        if (document.file_detail) {
            document.current_frame = this._binds.frameSpinner.getValue();
            this._binds.frameSpinner.setMaxValue(document.max_frames - 1);
            this._binds.frameSpinner.setValue(document.current_frame);
            this._binds.frameSlider.setValueAndUpdateMax(document.current_frame, document.max_frames - 1);
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue("Play");
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
        }
    }

    _handleFrameSlider() {
        if (document.file_detail) {
            document.current_frame = Math.floor(this._binds.frameSlider.getValue())
            this._binds.frameSpinner.setMaxValue(document.max_frames - 1);
            this._binds.frameSpinner.setValue(document.current_frame);
            this._binds.frameSlider.setValueAndUpdateMax(document.current_frame, document.max_frames - 1);
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
        }
    }

    _updateCurrentVolume() {
        document.current_frame += 1;
        if (document.current_frame == document.max_frames) {
            document.current_frame = 0;
        }
        this._binds.frameSpinner.setMaxValue(document.max_frames - 1);
        this._binds.frameSpinner.setValue(document.current_frame);
        this._binds.frameSlider.setValueAndUpdateMax(document.current_frame, document.max_frames - 1);
        this.dispatchEvent(new CustomEvent('load', document.file_detail));
    }

    _errorCheck() {
        if (document.current_error <= document.time_error_spinner || isNaN(document.current_error)) {
            console.log('Error now:' + document.current_error);
            this._updateCurrentVolume();
        }
    }

    _handlePlayButton() {
        if(document.file_detail) {
            if(document.is_playing == false) {
                // go pustame
                this._binds.playButton.setLabelValue('Stop');
                document.is_playing = true;
                if (document.time_or_error == 'timeValue') {
                    document.time_error_interval = window.setInterval(this._updateCurrentVolume, document.time_error_spinner);
                }
                else {
                    document.time_error_interval = window.setInterval(this._errorCheck, 100)
                }
            }
            else {
                // go stopirame 
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);
            } 
        }
    }

    _handlePreviousButton() {
        if (document.file_detail) {
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            // go vrakame nazad za 1 frame
            if (document.current_frame > 0) {
                document.current_frame -= 1;
                this._binds.frameSpinner.setMaxValue(document.max_frames - 1);
                this._binds.frameSpinner.setValue(document.current_frame);
                this._binds.frameSlider.setValueAndUpdateMax(document.current_frame, document.max_frames - 1);
                this.dispatchEvent(new CustomEvent('load', document.file_detail));
            }
        }
    }

    _handleNextButton() {
        if (document.file_detail) {
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            // go noseme napred za 1 frame
            if (document.current_frame + 1 < document.max_frames) {
                document.current_frame += 1;
                this._binds.frameSpinner.setMaxValue(document.max_frames - 1);
                this._binds.frameSpinner.setValue(document.current_frame);
                this._binds.frameSlider.setValueAndUpdateMax(document.current_frame, document.max_frames - 1);
                this.dispatchEvent(new CustomEvent('load', document.file_detail));
            }
        }
    }

    _handleTimeErrorSpinner() {
        document.timeErrorSpinner = this._binds.timeErrorSpinner.getValue();
        if (document.is_playing) {
            window.clearInterval(document.time_error_interval);
            if (document.time_or_error == 'timeValue') {
                document.time_error_interval = window.setInterval(this._updateCurrentVolume, document.time_error_spinner);
            }
            else {
                document.time_error_interval = window.setInterval(this._errorCheck, 100);
            }
        }
    }
    
    async _loadDemoJson() {
        try {
            const response = await fetch('demo-volumes.json');
            this._demos = await response.json();
            this._demos.forEach(demo => {
                this._binds.demo.addOption(demo.value, demo.label);
            });
        } catch (e) {
            console.warn('demo-volumes.json not available');
        }
    }
    
    _getVolumeTypeFromURL(filename) {
        const exn = filename.split('.').pop().toLowerCase();
        const exnToType = {
            'bvp'  : 'bvp',
            'json' : 'json',
            'zip'  : 'zip',
        };
        return exnToType[exn] || 'raw';
    }
    
    _handleLoadClick() {
        switch (this._binds.type.getValue()) {
            case 'file' : this._handleLoadFile(); break;
            case 'url'  : this._handleLoadURL();  break;
            case 'demo' : this._handleLoadDemo(); break;
        }
    }
    
    _handleLoadFile() {
        const files = this._binds.file.getFiles();
        if (files.length === 0) {
            // update status bar?
            return;
        }
    
        const file = files[0];
        const filetype = this._getVolumeTypeFromURL(file.name);
        const dimensions = this._binds.dimensions.getValue();
        const precision = parseInt(this._binds.precision.getValue(), 10);
        
        document.file_detail =  {
            detail: {
                type       : 'file',
                file       : file,
                filetype   : filetype,
                dimensions : dimensions,
                precision  : precision,
            }
        }

        this.dispatchEvent(new CustomEvent('load', document.file_detail));
    }
    
    _handleLoadURL() {
        const url = this._binds.url.getValue();
        const filetype = this._getVolumeTypeFromURL(url);
        this.dispatchEvent(new CustomEvent('load', {
            detail: {
                type     : 'url',
                url      : url,
                filetype : filetype,
            }
        }));
    }
    
    _handleLoadDemo() {
        const demo = this._binds.demo.getValue();
        const found = this._demos.find(d => d.value === demo);
        const filetype = this._getVolumeTypeFromURL(found.url);
        this.dispatchEvent(new CustomEvent('load', {
            detail: {
                type     : 'url',
                url      : found.url,
                filetype : filetype,
            }
        }));
    }
    
    _handleTypeChange() {
        // TODO: switching panel
        switch (this._binds.type.getValue()) {
            case 'file':
                this._binds.filePanel.show();
                this._binds.urlPanel.hide();
                this._binds.demoPanel.hide();
                break;
            case 'url':
                this._binds.filePanel.hide();
                this._binds.urlPanel.show();
                this._binds.demoPanel.hide();
                break;
            case 'demo':
                this._binds.filePanel.hide();
                this._binds.urlPanel.hide();
                this._binds.demoPanel.show();
                break;
        }
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleFileChange() {
        const files = this._binds.file.getFiles();
        if (files.length === 0) {
            this._binds.rawSettingsPanel.hide();
        } else {
            const file = files[0];
            const type = this._getVolumeTypeFromURL(file.name);
            this._binds.rawSettingsPanel.setVisible(type === 'raw');
        }
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleURLChange() {
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleDemoChange() {
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _updateLoadButtonAndProgressVisibility() {
        switch (this._binds.type.getValue()) {
            case 'file':
                const files = this._binds.file.getFiles();
                this._binds.loadButtonAndProgress.setVisible(files.length > 0);
                break;
            case 'url':
                const urlEmpty = this._binds.url.getValue() === '';
                this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
                break;
            case 'demo':
                const demo = this._binds.demo.getValue();
                this._binds.loadButtonAndProgress.setVisible(!!demo);
                break;
        }
    }
    
}
    