import find, { createHOGs } from "./find";
import train from "./train";
import { takeSnapshot, findProcess } from "./native";
import InspectImage from "./InspectImage";
import { saveImages } from "./debug";
import * as brain from "brain.js";
import { readFileSync } from "fs";
import * as path from "path";
import * as checkColor from "check-color";

(async function start() {
	const base64Images = readFileSync(path.join(__dirname, "./data/valid.txt"))
		.toString()
		.trim()
		.split("\r\n");
	//
	const trainingImages: Array<InspectImage> = await Promise.all(
		base64Images.map(imgData =>
			InspectImage.fromDataURI(imgData).then(image =>
				image.resizeMax(60).then(image =>
					image.darken(1, ([r, g, b, a]) => {
						return (
							checkColor.isOrange(`rgba(${r},${g},${b},${a})`) ||
							(!checkColor.isRed(`rgba(${r},${g},${b},${a})`) &&
								!checkColor.isBlue(`rgba(${r},${g},${b},${a})`))
						);
					})
				)
			)
		)
	);
	saveImages(trainingImages, "training");

	console.time("Train");
	const trainedNeuralNetwork = await train(
		new brain.NeuralNetwork({ hiddenLayers: [20, 20] }),
		trainingImages
	);
	console.timeEnd("Train");

	console.time("PrepareWindow");
	const windowImage: InspectImage = await (await getWindowImage());
	console.timeEnd("PrepareWindow");
	/*	await (await windowImage.illuminate(0.8)).save('.tmp/illuminate.jpg');
	await (await windowImage.lighten(0.8)).save('.tmp/lighten.jpg');
	await (await windowImage.hue(0.8)).save('.tmp/hue.jpg');
	await (await windowImage.saturate(0.8)).save('.tmp/saturate.jpg');
	await (await windowImage.blueify(0.8)).save('.tmp/blueify.jpg');
	await (await windowImage.darken(0.8)).save('.tmp/darken.jpg');
	await (await windowImage.greenify(0.8)).save('.tmp/greenify.jpg');
	await (await windowImage.redify(0.8)).save('.tmp/redify.jpg');
	await (await windowImage.grayscale()).save('.tmp/grayscale.jpg');*/

	console.time("PrepareInput");
	const screenshotSlices: Array<InspectImage> = (await windowImage.slice({
		size: { width: 65, height: 65 },
		scale: 1,
		stepSize: 5
	})).filter(image => image.check((r, g, b, a) => r > 155 || b > 155));
	//const screenshotSlicesGray: Array<InspectImage> = await Promise.all(screenshotSlices.map(image => image.hue(0.8)));
	saveImages([windowImage], "input2");
	saveImages(screenshotSlices, "input");

	const screenshotSliceHOGs = await createHOGs(screenshotSlices);
	console.timeEnd("PrepareInput");

	console.time("Search");
	const result = await find(trainedNeuralNetwork, screenshotSliceHOGs);
	console.timeEnd("Search");
	console.log(result);
})();

async function getWindowImage(): Promise<InspectImage> {
	const process = await findProcess("mspaint.exe");
	await process.bringToFront();

	const targetWindowSize = await process.getWindowSize();

	const imageData: ImageData = await takeSnapshot();
	const fullscreenImage: InspectImage = await InspectImage.fromImageData(
		imageData
	);
	return await fullscreenImage.crop(targetWindowSize);
}
