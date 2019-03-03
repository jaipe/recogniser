import * as brain from "brain.js";
import InspectImage from "../InspectImage";

export default function find(trainedNeuralNetwork: brain.NeuralNetwork, inputHOGs: Array<Array<number>>): Promise<Array<number>> {	
	return trainedNeuralNetwork.run(inputHOGs);
}