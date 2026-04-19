/**
 * Web stub for react-native-maps.
 * All map components are no-ops on web because this app is mobile-first.
 * MapPickerModal and CourierMap already have dedicated .web.tsx counterparts
 * that handle the web UI gracefully; this stub prevents Metro from choking
 * on the native-only internals of react-native-maps during web bundling.
 */
import React from 'react';
import { View } from 'react-native';

const noop = () => null;

const MapView = ({ children, style }: any) =>
  React.createElement(View, { style }, children);
MapView.Animated = MapView;

export default MapView;
export { MapView };
export const Marker = noop;
export const Polyline = noop;
export const Polygon = noop;
export const Circle = noop;
export const Callout = noop;
export const MapCallout = noop;
export const AnimatedRegion = class {};
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';
