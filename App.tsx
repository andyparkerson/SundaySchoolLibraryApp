import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import {AuthProvider} from './src/auth/AuthContext';

export type RootTabParamList = {
  Home: undefined;
  Books: undefined;
  Checkout: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: true,
              tabBarActiveTintColor: '#6200ea',
            }}>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Home'}}
            />
            <Tab.Screen
              name="Books"
              component={BooksScreen}
              options={{title: 'Books'}}
            />
            <Tab.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{title: 'Checkout'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default App;
