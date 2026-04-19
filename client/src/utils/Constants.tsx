import { Dimensions } from "react-native";

export const screenHeight = Dimensions.get('screen').height
export const screenWidth = Dimensions.get('screen').width

export enum Colors {
    primary = '#ac1d17',
    primaryDark = '#8a1611',
    primaryLight = '#c9423c',
    background = '#F9FAFB',
    backgroundDark = '#111827',
    text = '#1F2937',
    textLight = '#6B7280',
    white = '#FFFFFF',
    theme = '#ac1d17',
    secondary = '#F5E8E7',
    tertiary = '#5c1612',
    secondary_light='#FDF2F2',
    iosColor='#ac1d17',
    border = '#D1D5DB',
    
    glass_bg = 'rgba(255, 255, 255, 0.25)',
    glass_border = 'rgba(255, 255, 255, 0.4)',
    glass_shadow = 'rgba(0, 0, 0, 0.1)',
    
    gradient_start = '#ac1d17',
    gradient_middle = '#c9423c',
    gradient_end = '#e8a5a2',
    
    success = '#ac1d17',
    error = '#EF4444',
    warning = '#F59E0B',
    info = '#3B82F6'
}

