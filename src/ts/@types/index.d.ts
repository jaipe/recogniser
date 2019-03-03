declare module "bot-core" {
	export type Pos = { x: number; y: number };
	export type Size = { width: number; height: number };
	export type ImageOptions = { channels?: number };
	export type Rect = Pos & Size;
	export interface InspectImageAPI {
		copyToContext(targetContext: any): void;
		getImageData(rect?: Rect, channel?: number): any; //Array<number> | Uint8ClampedArray;
		createStream();
	}
	export interface FindOptions {
		sampleScales?: Array<number>;
		saveImages?: boolean;
	}

/*	export enum ColorModel {
		HSLA = 1,
		RGBA = 2
	}*/
}

declare module "bot-canvas" {
	export interface NodeCanvas extends HTMLCanvasElement {
		createJPEGStream(): ReadableStream;
		createPNGStream(): ReadableStream;
		getContext(
			contextId: "2d",
			contextAttributes?: CanvasRenderingContext2DSettings
		): NodeCanvasCanvasRenderingContext2D;
		// Disallow contexts other than "2d":
		getContext(
			contextId: "webgl" | "experimental-webgl",
			contextAttributes?: WebGLContextAttributes
		): null;
		getContext(
			contextId: string,
			contextAttributes?: {}
		): NodeCanvasCanvasRenderingContext2D | null;
	}

	export interface NodeCanvasCanvasRenderingContext2D
		extends CanvasRenderingContext2D {
		canvas: NodeCanvas;
	}
}
