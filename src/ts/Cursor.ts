import InspectImage from "./InspectImage";
import { Size, Rect, Pos } from "bot-core";

export default class Cursor {
	private relatedImage: InspectImage;
	private viewPort: Rect;
	private stepSize: number;

	static fromImage(
		image: InspectImage,
		cursorSize: Size,
		stepSize?: number
	): Cursor {
		return new Cursor(image, cursorSize, stepSize);
	}

	constructor(
		relatedImage: InspectImage,
		{ width, height }: Size,
		stepSize: number = 2
	) {
		this.viewPort = {
			width,
			height,
			x: 0,
			y: 0
		};
		this.relatedImage = relatedImage;
		this.stepSize = stepSize;
	}

	next(): Cursor {
		if (
			this.viewPort.x + this.stepSize + this.viewPort.width >
			this.relatedImage.width
		) {
			this.viewPort.x = 0;
			this.viewPort.y = this.viewPort.y + this.stepSize;
		} else {
			this.viewPort.x += this.stepSize;
		}

		return this;
	}

	hasSelectedImage(): boolean {
		const { x, y } = this.viewPort;
		return (
			x + this.viewPort.width <= this.relatedImage.width &&
			y + this.viewPort.height <= this.relatedImage.height
		);
	}

	getSelectedImage(): Promise<InspectImage> {
		const { x, y, width, height } = this.viewPort;
		const maxY = Math.min(y + height, this.relatedImage.height);
		const maxX = Math.min(x + width, this.relatedImage.width);

		return this.relatedImage.crop(this.viewPort);
	}
}
