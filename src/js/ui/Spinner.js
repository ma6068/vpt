// #part /js/ui/Spinner

// #link UIObject

class Spinner extends UIObject {

constructor(options) {
    super(TEMPLATES.ui.Spinner, options);

    Object.assign(this, {
        value : 0,
        min   : null,
        max   : null,
        step  : 1,
        unit  : null, // TODO: add a label with units at the end of input
        // If logarithmic, step size is proportional to value * this.step
        logarithmic : false
    }, options);

    this._handleInput = this._handleInput.bind(this);
    this._handleChange = this._handleChange.bind(this);

    let input = this._binds.input;
    if (this.value !== null) {
        input.value = this.value;
    }
    if (this.min !== null) {
        input.min = this.min;
    }
    if (this.max !== null) {
        input.max = this.max;
    }
    if (this.step !== null) {
        input.step = this.step;
    }

    input.addEventListener('input', this._handleInput);
    input.addEventListener('change', this._handleChange);
}

setEnabled(enabled) {
    this._binds.input.disabled = !enabled;
    super.setEnabled(enabled);
}

setValue(value) {
    this.value = value;
    if (this.min !== null) {
        this.value = Math.max(this.value, this.min);
    }
    if (this.max !== null) {
        this.value = Math.min(this.value, this.max);
    }
    if (this.logarithmic) {
        this._binds.input.step = this.value * this.step;
    }
    this._binds.input.value = this.value;
}

getValue() {
    return this.value;
}

setMinValue(value) {
    this.min = value;
    this._binds.input.min = value;
}

setMaxValue(value) {
    this.max = value;
    this._binds.input.max = value;
}

setStepValue(value) {
    this.step = value;
    this._binds.input.step = value;
}

_handleInput(e) {
    e.stopPropagation();

    if (this._binds.input.value === '') {
        return;
    }

    const parsedValue = parseFloat(this._binds.input.value);
    if (!isNaN(parsedValue)) {
        this.setValue(parsedValue);
        this.trigger('input');
    } else {
        this._binds.input.value = parsedValue;
    }
}

_handleChange(e) {
    e.stopPropagation();

    const parsedValue = parseFloat(this._binds.input.value);
    if (!isNaN(parsedValue)) {
        this.setValue(parsedValue);
        if (this._binds.input.value !== this.value) {
            this._binds.input.value = this.value;
            this.trigger('change');
        }
    } else {
        this._binds.input.value = this.value;
    }
}

}
