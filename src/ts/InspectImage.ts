import { InspectImageAPI, Size, Pos, Rect, ImageOptions } from "bot-core";
import { NodeCanvas, NodeCanvasCanvasRenderingContext2D } from "bot-canvas";
import {
	createCanvas,
	loadImage,
	createImageData as canvasCreateImageData
} from "canvas";
import { createWriteStream } from "fs";
import Cursor from "./Cursor";
import * as HSLATransform from "./util/transform/hsla";
import * as RGBATransform from "./util/transform";
import applyAlgorithmPerPixel from "./util/applyAlgorithmPerPixel";
import extractHOG from "./util/extractHOG";

const ColorModel = { RGBA: 1, HSLA: 2 };
const defaultHogConfig = {
	cellSize: 4,
	blockSize: 2,
	blockStride: 1,
	bins: 6,
	norm: "L2"
};

// Convert the integer to a double
// https://github.com/image-js/image-js/blob/a2deb5b4c193263d1cb784005d904ec7966f63cb/src/image/transform/greyAlgorithms.js#L15
// return data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
const luma601Algo = (r, g, b, a) => (r * 9798 + g * 19235 + b * 3735) >> 15;

function createImageData(
	rawData: Uint8ClampedArray | Array<number>,
	width,
	height
): ImageData {
	return canvasCreateImageData(
		Array.isArray(rawData) ? new Uint8ClampedArray(rawData) : rawData,
		width,
		height
	);
}

export default class InspectImage {
	public channels: number;
	private _cache = new Map();

	private imageData: ImageData & { _height?: number; _width?: number }; // Additional types for caching width/height

	constructor(
		imageData: ImageData,
		{ channels = 4 }: ImageOptions = { channels: 4 }
	) {
		const { data, width, height } = imageData;

		this.imageData = imageData;
		this.imageData._height = height;
		this.imageData._width = width;
		this.channels = channels;
	}

	public get width(): number {
		return this.imageData._width;
	}

	public get height(): number {
		return this.imageData._height;
	}

	public get data(): Uint8ClampedArray {
		return this.imageData.data;
	}

	static from(imageData: ImageData, options: ImageOptions) {
		return new InspectImage(imageData, options);
	}

	static fromImageAlgo(
		parentImage: InspectImage,
		algo: Function,
		colorModel = ColorModel.RGBA,
		imageOptions = {}
	): Promise<InspectImage> {
		return InspectImage.fromImageData(
			createImageData(
				applyAlgorithmPerPixel(
					algo,
					parentImage.getPixels(),
					colorModel
				),
				parentImage.width,
				parentImage.height
			),
			imageOptions
		);
	}

	static fromImageAlgoSync(
		parentImage: InspectImage,
		algo: Function,
		colorModel = ColorModel.RGBA,
		imageOptions = {}
	): InspectImage {
		return new InspectImage(
			createImageData(
				applyAlgorithmPerPixel(
					algo,
					parentImage.getPixels(),
					colorModel
				),
				parentImage.width,
				parentImage.height
			),
			imageOptions
		);
	}

	static fromImage(
		parentImage: InspectImage,
		options?: ImageOptions
	): Promise<InspectImage> {
		return InspectImage.fromImageData(parentImage.getImageData(), {
			channels: parentImage.channels,
			...options
		});
	}

	static fromImageRegion(
		parentImage: InspectImage,
		rect: Rect,
		options?: ImageOptions
	): Promise<InspectImage> {
		return InspectImage.fromImageData(parentImage.sample(rect), {
			channels: parentImage.channels,
			...options
		});
	}

	static fromImageDataSync(
		imageData: ImageData,
		options?: ImageOptions
	): InspectImage {
		return new InspectImage(imageData, options);
	}

	static fromImageData(
		imageData: ImageData,
		options?: ImageOptions
	): Promise<InspectImage> {
		return Promise.resolve(new InspectImage(imageData, options));
	}

	static fromDataURI(
		dataURI: string,
		options?: ImageOptions
	): Promise<InspectImage> {
		return loadImage(dataURI).then(image => {
			const canvas: NodeCanvas = createCanvas(image.width, image.height);
			const context: NodeCanvasCanvasRenderingContext2D = canvas.getContext(
				"2d"
			);

			context.drawImage(image, 0, 0);

			return Promise.resolve(
				new InspectImage(
					context.getImageData(0, 0, image.width, image.height),
					options
				)
			);
		});
	}

	slice({
		stepSize = 2,
		size = { width: 30, height: 30 },
		scale = 1
	}): Promise<Array<InspectImage>> {
		const cursor = Cursor.fromImage(this, size, stepSize);
		const queue: Array<Promise<InspectImage>> = [];
		while (cursor.hasSelectedImage()) {
			queue.push(cursor.getSelectedImage());
			cursor.next();
		}

		return Promise.all(queue);
	}

	resizeMax(maxDimension): Promise<InspectImage> {
		let height;
		let width;

		if (this.width >= this.height) {
			width = maxDimension;
			height = Math.floor(width / (this.width / this.height));
		} else {
			height = maxDimension;
			width = Math.floor(height * (this.width / this.height));
		}

		const constrainedWidth = Math.min(this.width, width);
		const constrainedHeight = Math.min(this.height, height);

		const canvas: NodeCanvas = createCanvas(
			constrainedWidth,
			constrainedHeight
		);
		const canvas2: NodeCanvas = createCanvas(this.width, this.height);
		const context: NodeCanvasCanvasRenderingContext2D = canvas.getContext(
			"2d"
		);
		const context2: NodeCanvasCanvasRenderingContext2D = canvas2.getContext(
			"2d"
		);
		context2.putImageData(this.getImageData(), 0, 0);
		context.drawImage(canvas2, 0, 0, constrainedWidth, constrainedHeight);

		return Promise.resolve(
			new InspectImage(
				context.getImageData(0, 0, canvas.width, canvas.height)
			)
		);
	}

	resize(
		width,
		height = Math.floor(width / (this.width / this.height))
	): Promise<InspectImage> {
		const constrainedWidth = Math.min(this.width, width);
		const constrainedHeight = Math.min(this.height, height);

		const canvas: NodeCanvas = createCanvas(
			constrainedWidth,
			constrainedHeight
		);
		const canvas2: NodeCanvas = createCanvas(this.width, this.height);
		const context: NodeCanvasCanvasRenderingContext2D = canvas.getContext(
			"2d"
		);
		const context2: NodeCanvasCanvasRenderingContext2D = canvas2.getContext(
			"2d"
		);
		context2.putImageData(this.getImageData(), 0, 0);
		context.drawImage(canvas2, 0, 0, constrainedWidth, constrainedHeight);

		return Promise.resolve(
			new InspectImage(
				context.getImageData(0, 0, canvas.width, canvas.height)
			)
		);
	}

	scale(scaleX, scaleY = scaleX): Promise<InspectImage> {
		const canvas: NodeCanvas = createCanvas(
			this.width * scaleX,
			this.height * scaleY
		);
		const context: NodeCanvasCanvasRenderingContext2D = canvas.getContext(
			"2d"
		);

		context.scale(scaleX, scaleY);

		return Promise.resolve(
			new InspectImage(
				context.getImageData(0, 0, canvas.width, canvas.height)
			)
		);
	}

	crop(rect: Rect): Promise<InspectImage> {
		return InspectImage.fromImageRegion(this, rect);
	}

	sample(rect: Rect): ImageData {
		const { x = 0, y = 0, width = 1, height = 1 } = rect;
		const widthChannelCount = width * 4;
		const samplePixels = new Uint8ClampedArray(width * height * 4);
		for (let yy = 0; yy < height; yy++) {
			const offset = (yy * this.width + x) * 4;
			samplePixels.set(
				this.data.subarray(offset, offset + widthChannelCount),
				yy * widthChannelCount
			);
		}
		return createImageData(samplePixels, width, height);
	}

	samplePixelChannel(pos: Pos, channel: number): number {
		const { x = 0, y = 0 } = pos;
		const offset = (y * this.width + x) * 4;

		if (channel >= this.channels) {
			throw new Error(
				`Image does not have ${channel} channels (0 is the first channel).`
			);
		}

		const targetChannel = (this.channels + channel) % 4;
		return this.data[offset + targetChannel];
	}

	check(algorithm) {
		const pixels = this.getPixels();

		for (let i = 0; i < pixels.length; i += 4) {
			if (algorithm(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])) {
				return true;
			}
		}

		return false;
	}

	hue(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			HSLATransform.multiplyByChannel([0], intensity),
			ColorModel.HSLA
		);
	}

	saturate(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			HSLATransform.multiplyByChannel([1], intensity),
			ColorModel.HSLA
		);
	}

	illuminate(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			HSLATransform.multiplyByChannel([2], intensity),
			ColorModel.HSLA
		);
	}

	alpha(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([3], intensity, threshold)
		);
	}

	lighten(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([0, 1, 2], intensity, threshold)
		);
	}

	darken(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([0, 1, 2], -intensity, threshold)
		);
	}

	greenify(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([1], intensity, threshold)
		);
	}

	blueify(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([2], intensity, threshold)
		);
	}

	redify(intensity = 0.3, threshold?): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.multiplyByChannel([0], intensity, threshold)
		);
	}

	extractHOG(hogConfig = defaultHogConfig): Array<number> {
		return extractHOG(this, hogConfig);
	}

	getImageData(): ImageData {
		return this.imageData;
	}

	getPixels(): Uint8ClampedArray {
		return this.data;
	}

	grayscale(algo = luma601Algo): Promise<InspectImage> {
		return InspectImage.fromImageAlgo(
			this,
			RGBATransform.makeGrayscale(algo),
			ColorModel.RGBA,
			{ channels: 2 }
		);
	}

	grayscaleSync(algo = luma601Algo): InspectImage {
		return InspectImage.fromImageAlgoSync(
			this,
			RGBATransform.makeGrayscale(algo),
			ColorModel.RGBA,
			{ channels: 2 }
		);
	}

	stream(): any {
		const canvas: NodeCanvas = createCanvas(this.width, this.height);
		const context: NodeCanvasCanvasRenderingContext2D = canvas.getContext(
			"2d"
		);

		context.putImageData(
			createImageData(this.imageData.data, this.width, this.height),
			0,
			0
		);

		return canvas.createPNGStream();
	}

	save(filename: string) {
		return new Promise((resolve, reject) =>
			this.stream()
				.pipe(createWriteStream(filename))
				.on("close", () => resolve(filename))
				.on("error", reject)
		);
	}
}
