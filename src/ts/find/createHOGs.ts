import InspectImage from "../InspectImage";

export default function createHOGs(inputImages: Array<InspectImage>): Promise<Array<Array<number>>> {
	const descriptorHOGs: Array<Array<number>> = inputImages.map(slice => slice.extractHOG());

	return Promise.resolve(descriptorHOGs);
}
