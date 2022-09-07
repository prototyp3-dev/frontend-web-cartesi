import { Buffer } from 'buffer';

// (window as any).global = window;
// (window as any).global.Buffer = Buffer;
(window as any).Buffer = Buffer;
(window as any).global.process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: require('next-tick')
} as any;
