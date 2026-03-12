export interface WaveConfig {
	frequency: number;
	amplitude: number;
	saturation: number;
	brightness: number;
}

export const generateRainbowColor = (offset: number): string => {
	const r = Math.sin(0.3 * offset) * 127 + 128;
	const g = Math.sin(0.3 * offset + 2) * 127 + 128;
	const b = Math.sin(0.3 * offset + 4) * 127 + 128;
	return `rgb(${r},${g},${b})`;
};

export const calculateWaveY = (
	x: number,
	time: number,
	layer: number,
	height: number,
	config: WaveConfig
): number => {
	const baseY = height / 2;
	return (
		baseY +
		Math.sin(x * config.frequency * 0.01 + time + layer) * (50 * config.amplitude) +
		Math.sin(x * config.frequency * 0.02 + time * 1.2) * (30 * config.amplitude) +
		Math.sin(x * config.frequency * 0.003 + time * 0.3) * (100 * config.amplitude)
	);
};

export const getWaveColor = (time: number, layer: number, config: WaveConfig): string => {
	const hue = (time + layer * 120) % 360;
	return `hsl(${hue}, ${config.saturation}%, ${config.brightness}%)`;
};
