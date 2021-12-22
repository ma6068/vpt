// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class MCMRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        extinctionScale       : 100,
        scatteringBias        : 0,
        majorant              : 100,
        maxBounces            : 8,
        steps                 : 16,
        _isovalue             : -1,
        _color                : [0.5, 0.5, 0.5],
        _light                : [1, 1, 1, 0],
        _elapsedTime          : 0,
        _previousTime         : new Date().getTime(),
        _done                 : false
    }, options);

    this._programs = WebGL.buildPrograms(gl, {
        generate  : SHADERS.MCMGenerate,
        integrate : SHADERS.MCMIntegrate,
        render    : SHADERS.MCMRender,
        reset     : SHADERS.MCMReset
    }, MIXINS);
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

startTesting(testingTime= 100, intervals= 100, saveAs = "MCM") {
    // [0.4595949351787567, 0.017016194760799408, -0.002319802064448595, 1.8643269150686592e-9, 0.0008531888015568256, 0.009490122087299824, 0.37735629081726074, 2.2245090214312313e-9, -1.7914464473724365, 23.797161102294922, -2.561542272567749, -4.89999532699585, 1.85416579246521, -21.197429656982422, 2.650918960571289, 5.0999956130981445]
    this.testingTime = testingTime * 1000;
    this.testingIntervalTime = this.testingTime/intervals;
    this.testingTotalTime = 0;
    this._previousTime = new Date().getTime();
    this._elapsedTime = 0
    this.testing = true;
    this.saveAs = saveAs;
    this.reset();
}

testingProtocalSave() {
    if (this.testing && this.testingTotalTime <= this.testingTime && this._elapsedTime >= this.testingIntervalTime) {
        let lastTime = this._elapsedTime;
        this.testingTotalTime += lastTime;
        // this._elapsedTime = lastTime - this.testingIntervalTime;
        this._elapsedTime = 0
        let canvas = document.getElementsByClassName("renderer")[0];
        let link = document.createElement('a');
        link.download = this.saveAs + "_" + this.testingTotalTime + ".png";
        link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        link.click();
    }
}

_resetFrame() {
    const gl = this._gl;

    const program = this._programs.reset;
    gl.useProgram(program.program);


    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // this._done = false;
    // this._previousTime = new Date().getTime();
    // this._elapsedTime = 0;
}

_generateFrame() {
}

_integrateFrame() {
    const gl = this._gl;
    if (this._done)
        return
    if (this._timer !== 0 && this._elapsedTime >= this._timer * 1000) {
        if (!this._done) {
            this._done = true
            console.log("Rendering stopped, total time:", this._elapsedTime)
        }
        return
    }

    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(program.uniforms.uPosition, 0);
    gl.uniform1i(program.uniforms.uDirectionAndBounces, 1);
    gl.uniform1i(program.uniforms.uWeight, 2);
    gl.uniform1i(program.uniforms.uRadianceAndSamples, 3);

    gl.uniform1i(program.uniforms.uVolume, 4);
    gl.uniform1i(program.uniforms.uEnvironment, 5);
    gl.uniform1i(program.uniforms.uTransferFunction, 6);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.uniform1f(program.uniforms.uExtinctionScale, this.extinctionScale);
    gl.uniform1f(program.uniforms.uScatteringBias, this.scatteringBias);
    gl.uniform1f(program.uniforms.uMajorant, this.majorant);
    gl.uniform1ui(program.uniforms.uMaxBounces, this.maxBounces);
    gl.uniform1ui(program.uniforms.uSteps, this.steps);

    gl.uniform1f(program.uniforms.uIsovalue, this._isovalue);
    gl.uniform3fv(program.uniforms.uColor, this._color);
    gl.uniform4fv(program.uniforms.uLight, this._light);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    const currentTime = new Date().getTime();
    this._elapsedTime += currentTime - this._previousTime;
    this._previousTime = currentTime;
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.uniform1i(program.uniforms.uColor, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this.testingProtocalSave()
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    const positionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const directionAnsBouncesBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const transmittanceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const radianceAndSamplesBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        positionBufferSpec,
        directionAnsBouncesBufferSpec,
        transmittanceBufferSpec,
        radianceAndSamplesBufferSpec,
    ];
}

}
