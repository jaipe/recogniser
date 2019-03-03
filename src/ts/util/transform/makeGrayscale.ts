export default function makeGrayscale(brightnessAlgo: Function) {
	return (channelColors: Array<number>) => {
		return new Array(3)
			.fill(
				brightnessAlgo(
					channelColors[0],
					channelColors[1],
					channelColors[2],
					channelColors[3]
				)
			)
			.concat(channelColors[3]);
	};
}
