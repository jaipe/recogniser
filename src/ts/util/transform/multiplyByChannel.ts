export default function multiplyByChannel(channels, intensity, condition?) {
    return (channelColors: Array<number>) => {
        const updatedChannels = [];

        for (let i = 0; i < channels.length; i++) {
            const targetChannelIndex = channels[i];
            const targetChannelValue = channelColors[targetChannelIndex];
            const shouldApply = condition ? condition(channelColors) : true;

            updatedChannels[targetChannelIndex] = shouldApply
                ? Math.ceil(
                      Math.min(
                          255,
                          targetChannelValue + targetChannelValue * intensity
                      )
                  )
                : undefined;
        }

        return [
            Math.min(
                updatedChannels[0] !== undefined
                    ? updatedChannels[0]
                    : channelColors[0],
                255
            ),
            Math.min(
                255,
                updatedChannels[1] !== undefined
                    ? updatedChannels[1]
                    : channelColors[1]
            ),
            Math.min(
                255,
                updatedChannels[2] !== undefined
                    ? updatedChannels[2]
                    : channelColors[2]
            ),
            Math.min(
                255,
                updatedChannels[3] !== undefined
                    ? updatedChannels[3]
                    : channelColors[3]
            )
        ];
    };
}
