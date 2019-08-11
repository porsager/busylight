declare module 'busylight' {
    export function devices(findUnsupported: boolean): device[];
    export function get(options?: options): Busylight;
    export { };

    export interface Busylight {
        options: options | supported[];
        buffer: number[];
        newProtocol: number;
        debug: boolean;
        connectAttempts: number;
        connected: boolean;
        _defaults: options;

        constructor(options: options | supported[])

        getColorArray(color: string | string[]): string[];
        connect(options: options);
        defaults(options: options): options;
        close(): void;
        off(): void;
        send(jingle: jingle): void;
        ring(tone?: tone | false, volume?: number): Busylight;
        light(color?: string | string[] | false): Busylight;
        blink(colors?: string | string[] | false, rate?: number): Busylight;
        pulse(colors?: string | string[] | false, rate?: number): Busylight;
    }

    export interface options {
        vendorId?: number;
        color?: string | string[];
        keepalive?: boolean;
        rate?: number;
        degamma?: boolean;
        tone?: tone,
        volume?: number;
    }

    export interface jingle {
        color?: string[];
        tone?: tone | false;
    }

    export interface supported {
        vendorId: number;
        productId: number;
    }

    export interface device {
        vendorId: number;
        productId: number;
        path: string;
        serialNumber: string;
        manufacturer: string;
        product: string;
        release: number;
        interface: number;
        usagePage: number;
        usage: number;
    }

    export type tone = 'OpenOffice' | 'Quiet' | 'Funky' | 'FairyTale' | 'KuandoTrain' | 'TelephoneNordic' | 'TelephoneOriginal' | 'TelephonePickMeUp' | 'Buzz';
}
