export default function multiplyByChannel(channels, intensity) {
	return (hslaChannelColors: Array<number>) => {
		const updatedChannels = [];

		for (let i = 0; i < channels.length; i++) {
			const targetChannelIndex = channels[i];
			const targetChannelValue = hslaChannelColors[targetChannelIndex];

			updatedChannels[targetChannelIndex] = Math.floor(
				targetChannelValue + targetChannelValue * intensity
			);
		}

		return [
			Math.min(
				updatedChannels[0] !== undefined ? updatedChannels[0] : hslaChannelColors[0],
				360
			),
			Math.min(
				1,
				updatedChannels[1] !== undefined ? updatedChannels[1] : hslaChannelColors[1]
			),
			Math.min(
				1,
				updatedChannels[2] !== undefined ? updatedChannels[2] : hslaChannelColors[2]
			),
			hslaChannelColors[3]
		];
	};
}
