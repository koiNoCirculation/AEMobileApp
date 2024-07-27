import { useEffect, useState } from "react";
import { Button, View } from "react-native";
import { Text } from "react-native";
import { TextInput } from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet } from "react-native";
import { Dimensions } from "react-native";
import * as SecureStore from 'expo-secure-store'

export default function SetupAENetowrk({route, navigation}) {
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState([])
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        async function f() {
            setUUID(SecureStore.getItem('user.uuid'));
            getAENetworks();
        }
        f();
    },[])

    async function getAENetworks() {
        const ip: string = SecureStore.getItem('server.ip');
        const port: string = SecureStore.getItem('server.port');
        if (ip !== undefined && port !== undefined) {
            try {
                var resp = await fetch(`http://${ip}:${port}/AE2/getNetworks?ownerUUID=${uuid}`);
                var j = await resp.json()
                setNetworks(j.body);
            } catch (e) {
                alert("请检查网络连接是否正常" + e);
            }
        }
    }
    return (
        <View>
            <View style={styles.container}>
                <View style={{ flexDirection: 'row' }}>
                    <Text>UUID(放下倪哥监控器方块获取)</Text>
                    <TextInput defaultValue={uuid} onChangeText={(text) => setUUID(text)} />
                </View>
                <Button title="获取所有ae网络" onPress={() => {
                    getAENetworks()
                }} />
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={networks.map((n, idx) => {
                        let s = `网络-dim${n.dimid}-x:${n.x}-y:${n.y}-z:${n.z}`
                        return { label: s, value: idx }
                    }
                    )}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? '选择你的主网' : '...'}
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
                            style={styles.icon}
                            color={isFocus ? 'blue' : 'black'}
                            name="Safety"
                            size={20}
                        />
                    )}
                />
                <Button title="确认" onPress={() => {
                    async function f() {
                        console.log("跳转主界面");
                        try {
                            SecureStore.setItem("user.uuid", uuid);
                            SecureStore.setItem("user.ae_main_net",`${networks[value].dimid},${networks[value].x},${networks[value].y},${networks[value].z}`);
                            navigation.navigate("Main");
                        } catch(e) {
                            console.log(e);
                        }
                    }
                    f();
                }}/>
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
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