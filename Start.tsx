import { StyleSheet } from "react-native";
import { View } from "react-native";
import { Button } from "react-native";
import { TextInput } from "react-native";
import { Text } from "react-native";
import { useEffect, useLayoutEffect, useState } from "react";
import AEView from "./AEItemView";
import { createStackNavigator } from '@react-navigation/stack'
import SetupAENetowrk from "./SetupAENetwork";
import { NavigationContainer } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import Settings from "./Settings";

export function Start({ route, navigation }) {
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState<number>(8080);
    useLayoutEffect(() => {
        setIP(SecureStore.getItem('server.ip'));
        let p = SecureStore.getItem('server.port')
        if (p != null) {
            setPort(parseInt(p))
        } else {
            setPort(8080);
        }
    }, [])
    return (
        <View style={styleSheet.outside}>
            <Text>请进行初始设置</Text>
            <View style={styleSheet.horizontal}>
                <Text>服务器IP地址:</Text>
                <TextInput defaultValue={ip} onChangeText={(txt) => { setIP(txt) }} />
            </View>
            <View style={styleSheet.horizontal}>
                <Text>服务器端口</Text>
                <TextInput defaultValue={port.toString()} onChangeText={(txt) => setPort(parseInt(txt))} />
            </View>
            <Button title="测试连接" onPress={() => {
                console.log(ip);
                fetch(`http://${ip}:${port}/AEMobileTest`).then(r => {
                    console.log(r.status)
                    if (r.status == 200) {
                        alert('测试成功');
                    } else {
                        alert('测试失败,请检查地址');
                    }
                }).catch(e => {
                    alert("请检查网络连接是否正常: " + e);
                })
            }} />
            <Button title="保存设置" onPress={() => {
                SecureStore.setItem('server.ip', ip);
                SecureStore.setItem('server.port', port.toString());
                navigation.navigate("SetupAENetwork")
            }} />
        </View>
    );
}

export default function StartNavigator() {
    const Stack = createStackNavigator()
    const [ready, setReady] = useState( SecureStore.getItem('server.ip') != null && SecureStore.getItem('server.scheme') != null && SecureStore.getItem("user.uuid") != null && SecureStore.getItem("user.ae_main_net") != null);
    return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName={ready ? "Main": "Start"}>
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