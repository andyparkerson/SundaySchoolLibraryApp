import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

function CheckoutScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Checkout</Text>
      <Text style={styles.body}>
        Book checkout and return management will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
});

export default CheckoutScreen;
