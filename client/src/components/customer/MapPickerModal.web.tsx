import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectedLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onSelectLocation: (location: {
    type: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  visible,
  onClose,
  title,
  selectedLocation,
  onSelectLocation,
}) => {
  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setAddress(selectedLocation?.address || '');
      setError('');
    }
  }, [visible, selectedLocation]);

  const handleConfirm = () => {
    if (!address.trim()) {
      setError('Please enter an address.');
      return;
    }

    const latitude = selectedLocation?.latitude;
    const longitude = selectedLocation?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Map pin selection is only available on iOS/Android right now.');
      return;
    }

    setError('');
    onSelectLocation({
      type: title,
      address,
      latitude,
      longitude,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select {title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.helperText}>
            Map selection is not available on web in this screen yet. Enter your address below.
          </Text>
          <Text style={styles.label}>Delivery address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your address"
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              if (error) setError('');
            }}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Set Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cancelButton: {
    fontSize: 16,
    color: '#EF4444',
  },
  inputContainer: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#DC2626',
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: '#ac1d17',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default memo(MapPickerModal);
