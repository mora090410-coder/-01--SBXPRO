
declare module 'qrcode.react' {
  import { FC, SVGAttributes, CanvasHTMLAttributes } from 'react';

  export interface QRCodeProps {
    value: string;
    size?: number;
    includeMargin?: boolean;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    imageSettings?: {
      src: string;
      x?: number;
      y?: number;
      height?: number;
      width?: number;
      excavate?: boolean;
    };
  }

  export const QRCodeCanvas: FC<QRCodeProps & CanvasHTMLAttributes<HTMLCanvasElement>>;
  export const QRCodeSVG: FC<QRCodeProps & SVGAttributes<SVGSVGElement>>;
}
