import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FilledBookmarkProps {
  size?: number;
  color?: string;
}

export default function FilledBookmark({ size = 24, color = '#000' }: FilledBookmarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17.5L5 21V5Z"
        fill={color}
      />
    </Svg>
  );
} 