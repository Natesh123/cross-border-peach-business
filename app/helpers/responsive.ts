import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

// Returns scaled dimension based on width (for paddings, margins, widths)
const scale = (size: number) => (width / guidelineBaseWidth) * size;

// Returns scaled dimension based on height (for heights)
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

// Returns moderately scaled dimension. 
// factor controls how much it scales. 0.5 means it scales half as much as a direct ratio.
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale, width, height };
