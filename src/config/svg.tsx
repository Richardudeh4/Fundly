/**
 * svg.tsx
 *
 * Two usage patterns are supported:
 *
 * 1. Inline SvgXml components (works immediately, no file imports needed):
 *    import { LoanIcon } from '@/config/svg';
 *    <LoanIcon width={24} height={24} color="#208AEF" />
 *
 * 2. Once metro.config.js + react-native-svg-transformer are active you can
 *    also import .svg files directly anywhere in the project:
 *    import Logo from '@/assets/images/logo.svg';
 *    <Logo width={48} height={48} />
 */

import React from 'react';
import { SvgXml } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

// ─── Raw SVG strings ──────────────────────────────────────────────────────────

const loanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" fill="none">
  <path d="M62.647 70.784c-.512 0-.948-.391-.995-.91-.325-3.617-3.308-6.437-6.938-6.561l-1.88-.063c-3.267.001-6.639-1.195-9.901-2.353-3.059-1.085-5.949-2.109-8.563-2.109-4.055 0-8.945.65-14.47 5.478a3.97 3.97 0 0 1-3.093 1.159l-2.322-.104a1 1 0 1 1 .09-1.998l2.285.104c.589-.043 1.227-.232 1.724-.666 6.023-5.263 11.359-5.972 15.786-5.972 2.959 0 6.148 1.131 9.232 2.225 3.103 1.101 6.313 2.238 9.269 2.238l1.914.064c4.637.156 8.446 3.759 8.862 8.379a1 1 0 0 1-.906 1.086c-.031.003-.061.004-.093.004v-.001z" fill="currentColor"/>
  <path d="M43.472 87.112a16.9 16.9 0 0 1-3.931-.434L25.14 83.468a19.65 19.65 0 0 0-4.798-.528h-5.814a1 1 0 1 1 0-2h5.814c1.757 0 3.518.194 5.233.577l14.401 3.211a15.06 15.06 0 0 0 3.729.383l7.97-.116a17.21 17.21 0 0 0 6.111-1.305l28.248-11.929a3.243 3.243 0 0 0 1.821-3.942 3.246 3.246 0 0 0-3.676-2.253c-3.898.694-8.247 1.838-12.851 3.049C58.636 73.903 45.712 77.302 39.914 71.984a1 1 0 0 1 1.352-1.475c4.995 4.583 17.937 1.175 29.358-1.827 4.645-1.222 9.031-2.376 13.01-3.084a5.246 5.246 0 0 1 5.937 3.637 5.246 5.246 0 0 1-2.949 6.367L58.571 85.529a19.1 19.1 0 0 1-6.866 1.465l-7.97.116a16.4 16.4 0 0 1-.263.002z" fill="currentColor"/>
  <path d="M14.528 87.88H1a1 1 0 0 1-1-1V59.93a1 1 0 0 1 1-1h13.527a1 1 0 0 1 1 1v26.95a1 1 0 0 1-1 1zM2 85.88h11.527V60.93H2V85.88zM56.614 15.764H45.195a1 1 0 0 1 0-2h11.419a1 1 0 0 1 0 2z" fill="currentColor"/>
  <path d="M50.904 30.502a1 1 0 0 1-1-1v-2.63a1 1 0 0 1 2 0v2.63a1 1 0 0 1-1 1zM50.904 52.415a1 1 0 0 1-1-1v-2.63a1 1 0 0 1 2 0v2.63a1 1 0 0 1-1 1z" fill="currentColor"/>
</svg>`;

const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" fill="none">
  <path d="M76.962 85.395H13.039a2 2 0 0 1-2-2V40.991a2 2 0 0 1 4 0v40.403h59.923V40.991a2 2 0 0 1 4 0v42.403a2 2 0 0 1-2 2.001z" fill="currentColor"/>
  <path d="M87.998 40.831c-.387 0-.778-.112-1.122-.346L45 12.023 3.124 40.485a2 2 0 1 1-2.248-3.308l43-29.226a2 2 0 0 1 2.248 0l43 29.226a2 2 0 0 1-1.126 3.654z" fill="currentColor"/>
  <path d="M76.962 23.319a2 2 0 0 1-2-2v-6.094h-9.01a2 2 0 0 1 0-4h11.01a2 2 0 0 1 2 2v8.094a2 2 0 0 1-2 2zM65.276 61.778H50.627a2 2 0 0 1-2-2V45.774a2 2 0 0 1 2-2h14.649a2 2 0 0 1 2 2v14.004a2 2 0 0 1-2 2zm-12.649-4h10.649V47.774H52.627V57.778zM39.373 61.778h-14.65a2 2 0 0 1-2-2V45.774a2 2 0 0 1 2-2h14.65a2 2 0 0 1 2 2v14.004a2 2 0 0 1-2 2zm-12.65-4h10.65V47.774h-10.65V57.778z" fill="currentColor"/>
</svg>`;

const repaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" fill="none">
  <path d="M89.297 82.666H6.792a.703.703 0 0 1-.703-.703V43.466c0-.388.315-.703.703-.703h82.505c.388 0 .703.315.703.703v38.497a.703.703 0 0 1-.703.703zM7.495 81.26h81.099V44.169H7.495V81.26z" fill="currentColor"/>
  <path d="M48.044 77.099c-7.931 0-14.383-6.452-14.383-14.384 0-7.931 6.452-14.383 14.383-14.383 7.932 0 14.384 6.452 14.384 14.383 0 7.932-6.452 14.384-14.384 14.384zm0-27.361c-7.156 0-12.977 5.821-12.977 12.977 0 7.156 5.821 12.977 12.977 12.977 7.156 0 12.977-5.821 12.977-12.977 0-7.156-5.821-12.977-12.977-12.977z" fill="currentColor"/>
  <path d="M83.728 77.099H66.436a.703.703 0 0 1 0-1.406h16.589V49.738H60.193a.703.703 0 0 1 0-1.406h23.535c.388 0 .703.315.703.703v27.361a.703.703 0 0 1-.703.703zM35.896 77.099H12.36a.703.703 0 0 1-.703-.703V49.035c0-.388.315-.703.703-.703h17.293a.703.703 0 0 1 0 1.406h-16.59v25.954h22.832a.703.703 0 0 1 0 1.407z" fill="currentColor"/>
</svg>`;

const settingsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" fill="none">
  <path d="M45.001 65.781C33.543 65.781 24.22 56.459 24.22 45c0-11.459 9.323-20.781 20.781-20.781S65.783 33.541 65.783 45c0 11.459-9.323 20.781-20.782 20.781zm0-35.563C36.851 30.218 30.22 36.85 30.22 45c0 8.151 6.631 14.782 14.781 14.782 8.151 0 14.782-6.631 14.782-14.782 0-8.15-6.631-14.782-14.782-14.782z" fill="currentColor"/>
  <path d="M34.268 90c-.669 0-1.338-.132-1.975-.395l-9.845-4.079a4.96 4.96 0 0 1-2.795-2.795 4.96 4.96 0 0 1 0-3.953c1.216-2.936.075-5.558-1.399-7.032-1.474-1.475-4.094-2.615-7.033-1.399a4.96 4.96 0 0 1-3.952.001 4.96 4.96 0 0 1-2.795-2.795L.396 58.699c-1.089-2.63.164-5.657 2.794-6.748C6.128 49.745 7.174 47.085 7.174 45c0-2.084-1.046-4.745-3.983-5.962a4.96 4.96 0 0 1-2.795-2.795 4.96 4.96 0 0 1 0-3.952l4.078-9.844c1.09-2.631 4.12-3.883 6.747-2.795 2.936 1.216 5.558.075 7.033-1.399 1.474-1.474 2.616-4.095 1.399-7.032-1.09-2.631.164-5.657 2.795-6.747l9.844-4.077a4.96 4.96 0 0 1 3.953 0 4.96 4.96 0 0 1 2.795 2.796c1.216 2.936 3.877 3.982 5.962 3.982 2.085 0 4.745-1.046 5.962-3.983 1.09-2.631 4.115-3.885 6.748-2.795l9.845 4.077a4.96 4.96 0 0 1 2.795 2.795 4.96 4.96 0 0 1-.001 3.953c-1.217 2.936-.074 5.557 1.399 7.031 1.475 1.474 4.097 2.615 7.032 1.399a4.97 4.97 0 0 1 3.953 0 4.96 4.96 0 0 1 2.796 2.796l4.077 9.843c1.089 2.631-.165 5.658-2.795 6.747C83.028 40.255 81.982 42.916 81.982 45c0 2.085 1.046 4.745 3.983 5.962h.001c2.629 1.091 3.883 4.117 2.795 6.747l-4.079 9.845a4.96 4.96 0 0 1-2.795 2.795 4.97 4.97 0 0 1-3.954-.001c-2.934-1.217-5.557-.074-7.031 1.399-1.474 1.475-2.615 4.096-1.399 7.032a4.97 4.97 0 0 1 .001 3.953 4.96 4.96 0 0 1-2.796 2.796l-9.844 4.077c-2.63 1.09-5.657-.166-6.748-2.794-1.217-2.938-3.877-3.985-5.962-3.985-2.084 0-4.746 1.047-5.962 3.984a4.96 4.96 0 0 1-2.794 2.795A4.95 4.95 0 0 1 34.268 90z" fill="currentColor"/>
</svg>`;

// ─── Component factory ────────────────────────────────────────────────────────

interface IconProps extends SvgProps {
  color?: string;
}

function makeSvgIcon(xml: string): React.FC<IconProps> {
  return function SvgIcon({ width = 24, height = 24, color = 'currentColor', ...rest }) {
    // Inject the caller's color into the raw SVG string
    const colored = xml.replace(/currentColor/g, color as string);
    return <SvgXml xml={colored} width={width} height={height} {...rest} />;
  };
}

export const HomeIcon = makeSvgIcon(homeSvg);
export const LoanIcon = makeSvgIcon(loanSvg);
export const RepayIcon = makeSvgIcon(repaySvg);
export const SettingsIcon = makeSvgIcon(settingsSvg);

/**
 * Generic escape hatch — render any SVG string directly.
 *
 * @example
 * import { SvgIcon } from '@/config/svg';
 * <SvgIcon xml={mySvgString} width={32} height={32} color="#208AEF" />
 */
export function SvgIcon({
  xml,
  color = 'currentColor',
  width = 24,
  height = 24,
  ...rest
}: IconProps & { xml: string }) {
  const colored = xml.replace(/currentColor/g, color as string);
  return <SvgXml xml={colored} width={width} height={height} {...rest} />;
}

/** @deprecated use named icon components instead */
export const Svg = {
  loan: loanSvg,
  home: homeSvg,
  repay: repaySvg,
  settings: settingsSvg,
};
