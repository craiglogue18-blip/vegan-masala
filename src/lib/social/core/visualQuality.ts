import sharp from "sharp";

export async function assertVisualDetail(
  input: string | Buffer,
  label: string,
  minimumDeviation = 6
) {
  const stats = await sharp(input).stats();
  const visibleChannels = stats.channels.slice(0, 3);
  const averageDeviation =
    visibleChannels.reduce((sum, channel) => sum + channel.stdev, 0) /
    Math.max(1, visibleChannels.length);

  if (!Number.isFinite(averageDeviation) || averageDeviation < minimumDeviation) {
    throw new Error(`${label} is blank or lacks enough visible detail`);
  }

  return averageDeviation;
}
