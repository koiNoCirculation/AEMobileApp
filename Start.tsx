import { StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import AEView from "./AEItemView";
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import Settings from "./Settings";

export default function StartNavigator() {
    const Stack = createStackNavigator()
    const [ready, setReady] = useState(null);
    function isReady(): boolean {
        let r = SecureStore.getItem('server.ip') != null && SecureStore.getItem('server.scheme') != null && SecureStore.getItem("user.uuid") != null
        try {
            r = r && JSON.parse(SecureStore.getItem("user.ae_main_net"))?.x != undefined
            
        } catch (e) {
            r = false;
        }
        return r;
    }
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={isReady() ? "Main" : "Start"}>
                <Stack.Screen name='Start' component={Settings} />
                <Stack.Screen name='Main' component={AEView} options={
                    {
                        headerShown: false
                    }
                } />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

const styleSheet = StyleSheet.create({
    outside: {
        flexDirection: 'column'
    },
    horizontal: {
        flexDirection: 'row'
    }
});