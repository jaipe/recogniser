import * as screenshot from "screenshot-desktop";
import * as getPixels from "get-pixels";
import {
	createImageData as canvasCreateImageData
} from "canvas";

export default async function takeSnapshot(): Promise<ImageData> {
	return screenshot().then(data => {
		return new Promise(resolve =>
			getPixels(
				data,
				"image/jpeg",
				(err, { data, shape: [width, height] }) =>
					resolve(canvasCreateImageData(
						new Uint8ClampedArray(data),
						width,
						height
					))
			)
		);
	});
};
