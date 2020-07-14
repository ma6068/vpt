// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js
// #include ../LightVolume.js

class FCDRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        _lightDirection    : [0.5, 0.5, 0.5],
        _stepSize        : 0.05,
        _alphaCorrection : 3
    }, options);

    this._programs = WebGL.buildPrograms(this._gl, {
        convection: SHADERS.FCDConvection,
        //diffusion: SHADERS.FCDDiffusion,
        generate  : SHADERS.FCDGenerate,
        integrate : SHADERS.FCDIntegrate,
        render    : SHADERS.FCDRender,
        reset     : SHADERS.FCDReset
    }, MIXINS);
}

setVolume(volume) {
    const gl = this._gl;
    this._volume = volume;
    const dimensions = this._volume.getDimensions('default');
    this._dimensions = dimensions;
    if (this._energyDensity)
        gl.deleteTexture(this._energyDensity);
    //this._createEnergyDensityTexture();
    this._energyDensity = new LightVolume(gl, 'distant', 0.5, 0.5, 0.5, volume.getDimensions('default'));
    this.reset();

}

_createEnergyDensityTexture() {
    const gl = this._gl;

    this._energyDensity = gl.createTexture();
    const dimensions = this._volume.getDimensions('default');
    this._dimensions = dimensions;
    // TODO separate function in WebGL.js
    gl.bindTexture(gl.TEXTURE_3D, this._energyDensity);
    gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R32F, dimensions.width, dimensions.height, dimensions.depth);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    // let energyDensityArray = new Float32Array(dimensions.width * dimensions.height * dimensions.depth).fill(0);

    let energyDensityArray = [];
    for (let z = 0; z < dimensions.depth; z++) {
        for (let y = 0; y < dimensions.height; y++) {
            for (let x = 0; x < dimensions.width; x++) {
                energyDensityArray.push(
                    x === 0 || y === 0 || z === 0 ||
                    x === dimensions.width - 1 || y === dimensions.height - 1 || z === dimensions.depth - 1);
            }
        }
    }

    console.log("Dimensions: " + dimensions.width + " " + dimensions.height + " " + dimensions.depth)
    // energyDensityArray[0] = 1;
    // energyDensityArray[dimensions.width - 1] = 1;
    // energyDensityArray[dimensions.width * (dimensions.height - 1)] = 1;
    // energyDensityArray[dimensions.width * dimensions.height - 1] = 1;

    gl.texSubImage3D(gl.TEXTURE_3D, 0,
        0, 0, 0, dimensions.width, dimensions.height, dimensions.depth,
        gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

_resetFrame() {
    const gl = this._gl;

    const program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_convection() {
    const gl = this._gl;
    const localSizeX = 16
    const localSizeY = 16

    const program = this._programs.convection;
    gl.useProgram(program.program);

    gl.bindImageTexture(0, this._energyDensity.getEnergyDensity(), 0, true, 0, gl.READ_WRITE, gl.R32F);
    gl.bindImageTexture(1, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.RGBA32F);
    // gl.bindImageTexture(2, this._transferFunction, 0, false, 0, gl.READ_ONLY, gl.RGBA32F);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.uniform1i(program.uniforms.uTransferFunction, 2);

    gl.uniform3i(program.uniforms.uSize, this._dimensions.width, this._dimensions.height, this._dimensions.depth);

    gl.uniform3fv(program.uniforms.uLightDirection, this._lightDirection);

    for (let i = 0; i < 1; i++) {
        gl.dispatchCompute(this._dimensions.width / localSizeX,
            this._dimensions.height / localSizeY,
            this._dimensions.depth);
    }
}

_generateFrame() {
    const gl = this._gl;

    this._convection();

    // console.log(this._energyDensity.toString());

    const program = this._programs.generate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_3D, this._energyDensity.getEnergyDensity());

    // gl.bindImageTexture(2, this._energyDensity, 0, false, 0, gl.READ_ONLY, gl.R32F);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1i(program.uniforms.uTransferFunction, 1);
    gl.uniform1i(program.uniforms.uEnergyDensity, 2);
    gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
    gl.uniform1f(program.uniforms.uAlphaCorrection, this._alphaCorrection);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;

    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform1i(program.uniforms.uFrame, 1);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    }];
}

}