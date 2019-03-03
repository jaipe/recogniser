const ColorModel = { RGBA: 1, HSLA: 2 };
import { HSLToRGB, RGBToHSL } from "./hslAlgorithms";

export default function applyAlgorithmPerPixel(
	algorithm: Function,
	currentPixels: Uint8ClampedArray,
	colorModel = ColorModel.RGBA
): Uint8ClampedArray {
	const updatedPixels = new Uint8ClampedArray(currentPixels.buffer.slice(0));
	const pixelCount = currentPixels.length / 4;

	if (colorModel === ColorModel.HSLA) {
		for (let px = 0; px < pixelCount; px++) {
			const a = currentPixels[px * 4 + 3];
			const colors: Array<number> = RGBToHSL(
				currentPixels[px * 4],
				currentPixels[px * 4 + 1],
				currentPixels[px * 4 + 2]
			);
			const algorithmResult = algorithm(colors.concat(a));

			if (algorithmResult !== null) {
				updatedPixels.set(
					HSLToRGB(
						algorithmResult[0],
						algorithmResult[1],
						algorithmResult[2]
					).concat(algorithmResult[3]),
					px * 4
				);
			}
		}
	} else {
		for (let px = 0; px < pixelCount; px++) {
			const a = currentPixels[px * 4 + 3];
			const algorithmResult = algorithm([
				currentPixels[px * 4],
				currentPixels[px * 4 + 1],
				currentPixels[px * 4 + 2],
				a
			]);
			if (algorithmResult !== null) {
				updatedPixels.set(algorithmResult, px * 4);
			}
		}
	}

	return updatedPixels;
}
