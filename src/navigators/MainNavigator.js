import React, { useEffect, useMemo, useReducer } from 'react';
import { Example } from '../screens';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailsScreen from '@/screens/product/ProductDetailsScreen';
import CollectionScreen from '@/screens/collection/CollectionsScreen';
import CollectionsScreen from '@/screens/collection/CollectionsScreen';
import ProductsByCategory from '@/screens/product/components/ProductsByCategory';
import ProductsBySubCategory from '@/screens/product/components/ProductsBySubCategory';
import LoginScreen from '@/screens/auth/LoginScreen';
import PersonalDetailsScreen from '@/screens/profile/PersonalDetailsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import * as Keychain from 'react-native-keychain';
import { Alert } from 'react-native';
import RNRestart from 'react-native-restart';
import SignUpScreen from '@/screens/auth/SignUpScreen';
const Stack = createStackNavigator();

export const AuthContext = React.createContext({});

// @refresh reset
const MainNavigator = () => {
  useEffect(() => {
    const getTokenExpiry = async () => {
      const token = await AsyncStorage.getItem('tokenExpiry');
      if (token) {
        var decoded = jwt_decode(token);
        var tokenExpiryDate = new Date(0);
        tokenExpiryDate.setUTCSeconds(decoded.exp);
        var currentDate = new Date();

        var remainingTime = tokenExpiryDate.getTime() - currentDate.getTime();

        if (remainingTime / 1000 <= 0) {
          Alert.alert(
            'Your session has expired.\n',
            'Please login again to continue.',
            [
              {
                text: 'Ok',
                onPress: () => {},
                style: 'destructive',
              },
            ],
          );
          authContext.signOut();
        }
      }
    };
    getTokenExpiry();
  }, [authContext]);

  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    },
  );

  const authContext = useMemo(
    () => ({
      signIn: async data => {
        await Keychain.setGenericPassword('email', data);
        dispatch({ type: 'SIGN_IN', token: data });
      },
      signOut: async () => {
        await Keychain.resetGenericPassword();
        AsyncStorage.removeItem('tokenExpiry');
        RNRestart.Restart();
        dispatch({ type: 'SIGN_OUT' });
      },
      state: state,
    }),
    [state],
  );
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await Keychain.getGenericPassword();
      } catch (e) {}

      userToken === false
        ? dispatch({ type: 'RESTORE_TOKEN', token: null })
        : dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  return (
    <AuthContext.Provider value={authContext}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeScreen" component={BottomTabNavigator} />
        <Stack.Screen
          name="ProductsByCategory"
          component={ProductsByCategory}
        />
        <Stack.Screen
          name="ProductsBySubCategory"
          component={ProductsBySubCategory}
        />
        <Stack.Screen
          name="ProductDetailsScreen"
          component={ProductDetailsScreen}
        />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="CollectionsScreen" component={CollectionsScreen} />
        {state.userToken == null ? (
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
        ) : (
          <></>
        )}
        <Stack.Screen
          name="PersonalDetailsScreen"
          component={PersonalDetailsScreen}
        />
      </Stack.Navigator>
    </AuthContext.Provider>
  );
};

export default MainNavigator;
