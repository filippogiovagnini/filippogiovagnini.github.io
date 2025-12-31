// Import canvas for WebGL support in Node.js
const { createCanvas } = require('canvas');

// Create a more complete WebGL mock using canvas
const createMockCanvas = () => {
    const canvas = createCanvas(1920, 1080);
    
    // Mock getContext to return our WebGL mock
    const originalGetContext = canvas.getContext.bind(canvas);
    canvas.getContext = jest.fn((contextType, options) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return mockWebGLContext;
        }
        return originalGetContext(contextType, options);
    });
    
    return canvas;
};

// Mock WebGL context for Three.js testing
const mockWebGLContext = {
    canvas: createMockCanvas(),
    drawingBufferWidth: 1920,
    drawingBufferHeight: 1080,
    getExtension: jest.fn((name) => {
        // Return mock extensions that Three.js might need
        const extensions = {
            'WEBGL_depth_texture': {},
            'OES_texture_float': {},
            'OES_texture_half_float': {},
            'OES_standard_derivatives': {},
            'OES_element_index_uint': {},
            'ANGLE_instanced_arrays': {
                drawArraysInstancedANGLE: jest.fn(),
                drawElementsInstancedANGLE: jest.fn(),
                vertexAttribDivisorANGLE: jest.fn()
            }
        };
        return extensions[name] || {};
    }),
    getParameter: jest.fn((param) => {
        // Mock common WebGL parameters that Three.js checks
        const params = {
            0x8B4C: 16, // MAX_VERTEX_ATTRIBS
            0x8872: 16, // MAX_TEXTURE_IMAGE_UNITS
            0x8B4D: 16, // MAX_VERTEX_UNIFORM_VECTORS
            0x8B4F: 16, // MAX_FRAGMENT_UNIFORM_VECTORS
            0x8B4E: 8,  // MAX_VARYING_VECTORS
            0x0D33: 16384, // MAX_TEXTURE_SIZE
            0x851C: 16384, // MAX_CUBE_MAP_TEXTURE_SIZE
            0x8073: 4,  // MAX_TEXTURE_MAX_ANISOTROPY_EXT
            0x1F02: 'WebKit WebGL', // RENDERER
            0x1F01: 'WebKit', // VENDOR
            0x1F00: 'WebGL 1.0', // VERSION
        };
        return params[param] || 1;
    }),
    getShaderPrecisionFormat: jest.fn(() => ({
        precision: 23,
        rangeMin: 127,
        rangeMax: 127
    })),
    createShader: jest.fn(() => ({ id: Math.random() })),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(() => ''),
    createProgram: jest.fn(() => ({ id: Math.random() })),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    getProgramInfoLog: jest.fn(() => ''),
    useProgram: jest.fn(),
    createBuffer: jest.fn(() => ({ id: Math.random() })),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    disableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniform1i: jest.fn(),
    uniformMatrix3fv: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    clearDepth: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    depthFunc: jest.fn(),
    depthMask: jest.fn(),
    blendFunc: jest.fn(),
    blendEquation: jest.fn(),
    cullFace: jest.fn(),
    frontFace: jest.fn(),
    viewport: jest.fn(),
    scissor: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    createTexture: jest.fn(() => ({ id: Math.random() })),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    activeTexture: jest.fn(),
    getUniformLocation: jest.fn(() => ({ id: Math.random() })),
    getAttribLocation: jest.fn(() => 0),
    createFramebuffer: jest.fn(() => ({ id: Math.random() })),
    bindFramebuffer: jest.fn(),
    framebufferTexture2D: jest.fn(),
    checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
    deleteBuffer: jest.fn(),
    deleteTexture: jest.fn(),
    deleteProgram: jest.fn(),
    deleteShader: jest.fn(),
    deleteFramebuffer: jest.fn(),
    // WebGL constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    FLOAT: 5126,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123,
    DEPTH_TEST: 2929,
    BLEND: 3042,
    CULL_FACE: 2884,
    SRC_ALPHA: 770,
    ONE_MINUS_SRC_ALPHA: 771,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    TEXTURE_2D: 3553,
    TEXTURE_CUBE_MAP: 34067,
    TEXTURE0: 33984,
    RGBA: 6408,
    RGB: 6407,
    LINEAR: 9729,
    NEAREST: 9728,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    CLAMP_TO_EDGE: 33071,
    REPEAT: 10497,
    FRAMEBUFFER: 36160,
    COLOR_ATTACHMENT0: 36064,
    FRAMEBUFFER_COMPLETE: 36053
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn((contextType, options) => {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
        return mockWebGLContext;
    }
    if (contextType === '2d') {
        return {
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest.fn(),
            putImageData: jest.fn(),
            createImageData: jest.fn(),
            setTransform: jest.fn(),
            drawImage: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
        };
    }
    return null;
});

// Mock document.createElement to return our mock canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
        return createMockCanvas();
    }
    return originalCreateElement(tagName);
});

// Mock performance.now
global.performance = global.performance || {};
global.performance.now = jest.fn(() => Date.now());

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
    clearTimeout(id);
});

// Mock window dimensions for desktop detection
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
});

Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: 1,
});

// Mock window.matchMedia for reduced motion detection
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};