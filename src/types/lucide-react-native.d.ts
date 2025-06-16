declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { ViewProps } from 'react-native';

  interface IconProps extends ViewProps {
    size?: number;
    color?: string;
  }

  export const Search: FC<IconProps>;
  export const Heart: FC<IconProps>;
  export const MessageCircle: FC<IconProps>;
  export const Share2: FC<IconProps>;
  export const Flag: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const Ellipsis: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const Bookmark: FC<IconProps>;
  export const UserPlus: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Home: FC<IconProps>;
  export const Archive: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Menu: FC<IconProps>;
  export const AlignJustify: FC<IconProps>;
  export const ChevronLeft: FC<IconProps>;
} 