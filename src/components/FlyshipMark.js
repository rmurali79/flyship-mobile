import React from 'react';
import Svg, { G, Circle, Ellipse, Polygon, Line } from 'react-native-svg';

// Globe + banking dart + speed trail. Coordinates are shared with the web
// FlyshipMark (frontend/src/components/FlyshipMark.js) — keep both in sync
// if the mark ever changes.
const FlyshipMark = ({ size = 32, dark = false }) => {
    const ink = dark ? '#EEF2F6' : '#0B1B2E';
    const globe = dark ? '#7D9AB6' : '#3E5B78';
    const trail = dark
        ? ['#FF7A33', '#C26232', '#794630']
        : ['#D85A1C', '#E28355', '#EDB599'];

    return (
        <Svg width={size} height={size * (130 / 156)} viewBox="0 0 156 130">
            <G transform="translate(-5,-39)">
                <G fill="none" stroke={globe} strokeWidth={2.4}>
                    <Circle cx="44" cy="78" r="30" />
                    <Ellipse cx="44" cy="78" rx="30" ry="9" />
                    <Ellipse cx="44" cy="78" rx="11" ry="30" />
                </G>
                <G transform="translate(114,78) rotate(-38)">
                    <Line x1="-34" y1="10" x2="-74" y2="-4" stroke={trail[0]} strokeWidth={5} strokeLinecap="round" />
                    <Line x1="-37" y1="20" x2="-84" y2="15" stroke={trail[1]} strokeWidth={3.5} strokeLinecap="round" />
                    <Line x1="-35" y1="29" x2="-92" y2="32" stroke={trail[2]} strokeWidth={2} strokeLinecap="round" />
                    <Polygon points="48,0 -24,-20 -6,-3 -6,6 -34,16" fill={ink} />
                    <Line x1="26" y1="-3" x2="-22" y2="8" stroke={trail[0]} strokeWidth={2} strokeLinecap="round" />
                </G>
            </G>
        </Svg>
    );
};

export default FlyshipMark;
