import { Platform } from 'react-native';
import NativeMapPickerModal from './MapPickerModal.native';
import WebMapPickerModal from './MapPickerModal.web';

const MapPickerModal = Platform.OS === 'web' ? WebMapPickerModal : NativeMapPickerModal;

export default MapPickerModal;
