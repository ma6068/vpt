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
        this._handlePreviousButton = this._handlePreviousButton.bind(this);
        this._handlePlayButton = this._handlePlayButton.bind(this);
        this._handleNextButton = this._handleNextButton.bind(this);
        this._errorCheck = this._errorCheck.bind(this);
        this._loadNextData = this._loadNextData.bind(this);
        this._handleTimeErrorSpinner = this._handleTimeErrorSpinner.bind(this);
        this._handleDataSpinner = this._handleDataSpinner.bind(this);
        this._handleDataSlider = this._handleDataSlider.bind(this);

        this._handleCreateVideo = this._handleCreateVideo.bind(this);
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
        this._binds.dataSlider.addEventListener('change', this._handleDataSlider);
        this._binds.dataSpinner.addEventListener('change', this._handleDataSpinner);
        this._binds.timeErrorSpinner.addEventListener('change', this._handleTimeErrorSpinner);

        this._binds.createVideo.addEventListener('click', this._handleCreateVideo);
        // Dodadeno kraj
    }

    // ova se povikuva koga se menuva po sto da renderirame time ili error
    _handleRenderType() {
        document.time_or_error = this._binds.renderType.getValue();
        document.is_playing = false;
        this._binds.playButton.setLabelValue('Play');
        window.clearInterval(document.time_error_interval);
        if (document.time_or_error == 'timeValue') {
            this._binds.timeErrorLabel.setLabelValue('Milliseconds:');
            this._binds.timeErrorSpinner.setMinValue(500);
            this._binds.timeErrorSpinner.setMaxValue(30000);
            this._binds.timeErrorSpinner.setStepValue(500);
            this._binds.timeErrorSpinner.setValue(500);
            document.time_error_spinner = 500;
        }
        else {
            this._binds.timeErrorLabel.setLabelValue('Threshold:');
            this._binds.timeErrorSpinner.setMinValue(0);
            this._binds.timeErrorSpinner.setMaxValue(3);
            this._binds.timeErrorSpinner.setStepValue(0.1);
            this._binds.timeErrorSpinner.setValue(0.2);
            document.time_error_spinner = 0.2;
        }
    }

    // se povikuva pri promena na vrednosta vo poleto raw
    _handleDataSpinner() {
        if (document.file_detail) {
            document.current_input = this._binds.dataSpinner.getValue();
            this._binds.dataSpinner.setMaxValue(document.max_input_data  - 1);
            this._binds.dataSpinner.setValue(document.current_input);
            this._binds.dataSlider.setValueAndUpdateMax(document.current_input, document.max_input_data - 1);
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue("Play");
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
        }
    }

    // se povikuva pri promena na vrednosta vo slajderot (linijata)
    _handleDataSlider() {
        if (document.file_detail) {
            document.current_input = Math.floor(this._binds.dataSlider.getValue())
            this._binds.dataSpinner.setMaxValue(document.max_input_data  - 1);
            this._binds.dataSpinner.setValue(document.current_input);
            this._binds.dataSlider.setValueAndUpdateMax(document.current_input, document.max_input_data - 1);
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
        }
    }

    _loadNextData() {
        var canvas = document.getElementsByClassName("renderer");
        var image = canvas[0].toDataURL("image/png", 1.0);
        var atag = document.createElement('a');
        atag.download = "image" + String(document.temporal_image_index) + ".png";
        atag.href = image;
        atag.click();
        document.temporal_image_index += 1;
        document.temporal_images.push(image);
        document.current_input += 1;
        if (document.current_input == document.max_input_data) {
            document.current_input = 0;
        }
        this._binds.dataSpinner.setMaxValue(document.max_input_data - 1);
        this._binds.dataSpinner.setValue(document.current_input);
        this._binds.dataSlider.setValueAndUpdateMax(document.current_input, document.max_input_data - 1);
        var realTime = performance.now() - document.real_time;
        console.log("Real time: " + realTime);
        this.dispatchEvent(new CustomEvent('load', document.file_detail));
        document.real_time = performance.now();
    }

    _errorCheck() {
        // ako dovolno dobro renderirame odime na nareden raw
        if (document.time_error_spinner > document.current_error) {
            console.log('Next volume');
            this._loadNextData();
        }
    }

    _handlePlayButton() {
        if(document.file_detail) {
            if(document.is_playing == false) {
                // go pustame
                this._binds.playButton.setLabelValue('Stop');
                document.is_playing = true;
                if (document.time_or_error == 'timeValue') {
                    document.time_error_interval = window.setInterval(this._loadNextData, document.time_error_spinner);
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

    _handleCreateVideo() {
        if (document.file_detail) {
            // go stopirame ako e pusteno
            if (document.is_playing) {
                this._binds.playButton.setLabelValue('Play');
                document.is_playing = false;
                window.clearInterval(document.time_error_interval);           
            }
            console.log("kliknat sum!");
            
            document.temporal_images = [];  // na kraj ja cisteme tabelata so sliki
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
            // go vrakame nazad za 1 input
            if (document.current_input > 0) {
                document.current_input -= 1;
            }
            else {
                document.current_input = document.max_input_data - 1;
            }
            this._binds.dataSpinner.setMaxValue(document.max_input_data - 1);
            this._binds.dataSpinner.setValue(document.current_input);
            this._binds.dataSlider.setValueAndUpdateMax(document.current_input, document.max_input_data - 1);
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
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
            // go noseme napred za 1 input
            if (document.current_input + 1 < document.max_input_data) {
                document.current_input += 1;
            }
            else {
                document.current_input = 0;
            }
            this._binds.dataSpinner.setMaxValue(document.max_input_data - 1);
            this._binds.dataSpinner.setValue(document.current_input);
            this._binds.dataSlider.setValueAndUpdateMax(document.current_input, document.max_input_data - 1);
            this.dispatchEvent(new CustomEvent('load', document.file_detail));
        }
    }

    // ova se povikuva koga ke ima promeni vo vrednosta (milisekundi / greska)
    _handleTimeErrorSpinner() {
        document.time_error_spinner = this._binds.timeErrorSpinner.getValue();
        if (document.is_playing) {
            window.clearInterval(document.time_error_interval);
            if (document.time_or_error == 'timeValue') {
                document.time_error_interval = window.setInterval(this._loadNextData, document.time_error_spinner);
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
    