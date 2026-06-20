declare module "utif" {
    export function decode(buffer: ArrayBuffer): unknown[];
    export function decodeImage(buffer: ArrayBuffer, image: unknown): void;
    export function toRGBA8(image: unknown): Uint8Array;
}
