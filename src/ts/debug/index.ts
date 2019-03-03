import * as path from "path";
import * as gm from "gm";
import * as fs from "fs";

import InspectImage from "../InspectImage";
/*import Cursor from "../Cursor";
import { FindOptions } from "bot-core";
import { takeSnapshot, findProcess } from "../native";

export default async function debug(windowImage: InspectImage, { saveImages = false, sampleScales = [1, 0.7] }: FindOptions) {
	return Promise.all(
		sampleScales.map(async scale => {
			console.time(`ProcessImage (x${scale})`);
			const images: Array<InspectImage> = await windowImage.slice({ scale });
			console.timeEnd(`ProcessImage (x${scale})`);

			if (saveImages) {
				console.time(`SaveImages (x${scale})`);
				return saveImageTiles(images, scale.toString()).then(filename => {
					console.timeEnd(`SaveImages (x${scale})`);
					return filename;
				});
			}

			return Promise.resolve();
		})
	);
}*/

export function saveImages(
	images: Array<InspectImage>,
	folderName = ""
): Promise<any> {
	let promise;
	const bufferSize = 75;
	const writePath = path.join(process.cwd(), ".tmp/.delete", folderName);

	if (!fs.existsSync(writePath)) {
		fs.mkdirSync(writePath);
	}

	return images.reduce((lastPromise, image, i) => {
		if (i === 0 || i % bufferSize === 0) {
			promise = lastPromise;
		}
		return promise.then(() =>
			image.save(
				path.join(process.cwd(), ".tmp/.delete", folderName, `${i}.png`)
			)
		);
	}, Promise.resolve());
}
/*
function getTilesByScale(image: InspectImage, scale = 1) {
	const cursor = Cursor.fromImage(
		image,
		{ width: 30, height: 30 },
		10
	);
	const queue = [];
	while (cursor.hasSelectedImage()) {
		queue.push(cursor.getSelectedImage());
		cursor.next();
	}

	return Promise.all(queue);
}
*/