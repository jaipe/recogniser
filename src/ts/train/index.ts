import InspectImage from "../InspectImage";
import * as path from "path";
import * as brain from "brain.js";

function createDefaultNetwork() {
	return new brain.NeuralNetwork();
}

export default function train(neuralNetwork: brain.NeuralNetwork = createDefaultNetwork(), images: Array<InspectImage>): Promise<brain.NeuralNetwork> {
	console.log(`Loading ${images.length} images...`);

	return Promise.all(
		images.map((image: InspectImage) => ({ input: image.extractHOG(), output: [1] }))
	).then(trainingData =>
		neuralNetwork.train(trainingData, {
			logPeriod: 5
		})
	)
	.then(networkState => {
		console.log(networkState);

		return neuralNetwork;
	});
}
