import { StyleSheet, Text } from "react-native";
import { View } from "react-native";
import { Button } from "@ant-design/react-native";
import { TextInput } from "react-native";
import { Toast } from "@ant-design/react-native";
import { useEffect, useLayoutEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import { Dropdown } from "react-native-element-dropdown";
import { Dimensions } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { List } from "@ant-design/react-native";
import { Provider } from "@ant-design/react-native";


export default function Settings({ route, navigation }) {
    const [ip, setIP] = useState<string>(null);
    const [scheme, setScheme] = useState("http");
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState([])
    const [value, setValue] = useState(null);
    const [network, setNetwork] = useState<string[]>(['0','0','0','0']);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        setIP(SecureStore.getItem('server.ip'));
        setUUID(SecureStore.getItem('user.uuid'));
        setScheme(SecureStore.getItem('server.scheme') == null ? 'http' : SecureStore.getItem('server.scheme'));
        setNetwork(SecureStore.getItem('user.ae_main_net')?.split(","));
    }, [])

    async function getAENetworks() {
        console.log(ip, scheme)
        if (ip !== undefined && scheme !== undefined) {
            try {
                var resp = await fetch(`${scheme}://${ip}:44444/AE2/getNetworks?ownerUUID=${uuid}`);
                console.log(JSON.stringify(resp))
                var j = await resp.json()
                if (j.body.length <= 0) {
                    Toast.fail("你还没在服务器放置倪哥监控器")
                } else {
                    setNetworks(j.body);
                    Toast.success("请选择一个网络作为你的主网");
                }
            } catch (e) {
                alert("请检查网络连接是否正常" + e);
            }
        } else {
            Toast.fail("请先填入服务器IP和密码。进入游戏后在ME控制器旁放置倪哥监控器获得密码。")
        }
    }

    return (
        <Provider>
            <View style={styleSheet.outside}>
                <Dropdown
                    style={[styleSheet.dropdown, isFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styleSheet.placeholderStyle}
                    selectedTextStyle={styleSheet.selectedTextStyle}
                    inputSearchStyle={styleSheet.inputSearchStyle}
                    iconStyle={styleSheet.iconStyle}
                    data={networks.map((n, idx) => {
                        let s = `网络-dim${n.dimid}-x:${n.x}-y:${n.y}-z:${n.z}`
                        return { label: s, value: idx }
                    }
                    )}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={'选择你的主网'}
                    searchPlaceholder="Search..."
                    value={value}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={item => {
                        setValue(item.value);
                        setIsFocus(false);
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styleSheet.icon}
                            color={isFocus ? 'blue' : 'black'}
                            name="Safety"
                            size={20}
                        />
                    )}
                />
                <List renderHeader="服务器地址">
                    <List.Item>
                        <TextInput defaultValue={ip} onChangeText={(txt) => { setIP(txt) }} />
                    </List.Item>
                </List>
                <List renderHeader="密码">
                    <List.Item>
                        <TextInput placeholder="游戏放下倪哥监控器后获取" defaultValue={uuid} onChangeText={(text) => setUUID(text)} />
                    </List.Item>
                </List>
                <List renderHeader="连接的AE网络">
                    <List.Item>
                        <Text> {network != null ? `DIM:${network[0]}, x:${network[1]}, y:${network[2]}, z:${network[3]}`  : '未连接'}</Text>
                    </List.Item>
                </List>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <Button type='warning' onPress={() => {
                        let url = `http://${ip}:44444/AEMobileTest`
                        console.log(url)
                        fetch(url).then(r => {
                            console.log(r.status)
                            setScheme('http')
                            if (r.status == 200) {
                                Toast.success("测试成功")
                                //alert('测试成功');
                            } else {
                                alert('测试失败,请检查地址');
                            }
                        }).catch(e => {
                            url = `https://${ip}:44444/AEMobileTest`
                            console.log(url)
                            fetch(url).then(r => {
                                console.log(r.status)
                                setScheme('https')
                                if (r.status == 200) {
                                    Toast.success("测试成功")
                                    //alert('测试成功');
                                } else {
                                    alert('测试失败,请检查地址');
                                }
                            }).catch(e => {
                                console.log(url)
                                alert("请检查网络连接是否正常: " + e);
                            })
                        })
                    }}>测试连接</Button>
                    <Button type="primary" onPress={() => {
                        getAENetworks()
                    }} >获取所有ae网络</Button>


                    <Button type="primary" onPress={() => {
                        console.log("press");
                        SecureStore.setItem('server.ip', ip);
                        SecureStore.setItem('server.scheme', scheme);
                        SecureStore.setItem("user.uuid", uuid);
                        SecureStore.setItem("user.ae_main_net", `${networks[value].dimid},${networks[value].x},${networks[value].y},${networks[value].z}`);
                        navigation.navigate('Main');
                    }}>保存设置</Button>
                </View>

            </View>
        </Provider>
    );
}

const styleSheet = StyleSheet.create({
    outside: {
        flexDirection: 'column'
    },
    horizontal: {
        flexDirection: 'row'
    },
    container: {
        backgroundColor: 'white',
        padding: 16,
        flexDirection: 'column'
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        width: Dimensions.get('window').width
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});