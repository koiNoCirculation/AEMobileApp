import { View, Text, StyleSheet, Image, Button, Easing, Alert } from "react-native";
import { useEffect, useState } from "react";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { FlexGrid } from "react-native-flexible-grid";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import { createDrawerNavigator } from "@react-navigation/drawer";
import EventSource from "react-native-sse";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { Dimensions } from "react-native";
import { createContext } from "react";
import * as SecureStore from 'expo-secure-store'
import { useContext } from "react";
import Settings from "./Settings";
import { Animated } from "react-native";
import { ActivityIndicator, Button as AntButton, Tooltip } from '@ant-design/react-native';
import Input from "@ant-design/react-native/lib/input-item/Input";
import { Card,Checkbox } from '@ant-design/react-native'
var NBT = require('parsenbt-js');

/*
create table if not exists item_panel (
    id integer primary key,
    item_name string,
    item_id string,
    item_meta string,
    has_nbt string,
    dname string,
    icon string
);
create table if not exists fluid_container (
    id integer primary key,
    fluid_name string,
    item: string,
    meta: string,
    container_display_name string,
    amount integer);
*/
const Tab = createBottomTabNavigator()
const CraftingCPUSideTab = createDrawerNavigator();
const ItemViewStack = createNativeStackNavigator()
const ServerInfoContext = createContext("");
const FluidInfoContext = createContext({});
class CraftPlan {
    bytesUsed: number;
    plan: CraftingTaskItem[];
}
class ItemStack {
    item_name: string;
    original_name: string;//ae2fc流体映射到1000mb的容器
    meta: number;
    original_meta: number;//ae2fc流体映射到1000mb的容器
    dname: string;
    nbt: string;
    nbtobj: object;
    count: number;
    craftable: false;
}
class CraftingTaskItem {
    name: string;
    original_name: string;//ae2fc流体映射到1000mb的容器
    meta: number;
    original_meta: string////ae2fc流体映射到1000mb的容器
    nbt: string;
    nbtobj: object;
    isCrafting: boolean;
    numberPresent: number;
    numberSent: number;
    numberRemainingToCraft: number;
    missing: number;
    widthRatio = 3.0;
    heightRatio = 1.0;
    constructor(name: string, isCrafting: boolean, numberSent: number, numberRemainingToCraft: number) {
        this.name = name;
        this.isCrafting = isCrafting;
        this.numberSent = numberSent;
        this.numberRemainingToCraft = numberRemainingToCraft;
    }
}
function encode(params) {
    var formBody = [];
    for (var property in params) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(params[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    return formBody.join('&');
}
function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function getFluidNameFromNBT(nbtobj) {
    return nbtobj['comp>']["str>Fluid"];
}
function getServerInfo() {
    return {
        ip: SecureStore.getItem('server.ip'),
        scheme: SecureStore.getItem('server.scheme'),
        uuid: SecureStore.getItem('user.uuid'),
        mainnet: JSON.parse(SecureStore.getItem('user.ae_main_net')),
        port: SecureStore.getItem('server.port')
    }
}
function replaceAE2FC(e: ItemStack, fluidInfo: object, loadedItem) {
    if (e.item_name == 'ae2fc:fluid_drop') {
        let fluidName = getFluidNameFromNBT(e.nbtobj)
        if (fluidInfo[fluidName] != undefined) {
            e.original_name = e.item_name;
            e.item_name = fluidInfo[fluidName][0];
            //e.count = e.count / fluidInfo[fluidName][1];
            e.original_meta = e.meta
            e.meta = fluidInfo[fluidName][2]
            e.dname = (loadedItem[e.item_name + ":" + e.meta]?.dname)?.replace("单元", "");

        } else {
            console.log(fluidName);
        }
    }
    return e;
}


function formatItemCount(itemCount: number) {
    if (itemCount < 10000) {
        return itemCount.toString();
    } else if (itemCount < 1000000) {
        return (itemCount / 1024).toPrecision(3) + "K";
    } else if (itemCount < 1000000000) {
        return (itemCount / 1048576).toPrecision(3) + "M";
    } else if (itemCount < 1000000000000) {
        return (itemCount / 1073741824).toPrecision(3) + "G";
    } else {
        return (itemCount / 1099511627776).toPrecision(3) + "T";
    }
}

function loadItemSingle(db: SQLiteDatabase, item: CraftingTaskItem) {
    let dname = null;
    if (item.name == 'ae2fc:fluid_drop') {
        item.nbtobj = NBT.Reader(base64ToArrayBuffer(item.nbt))
        let q = db.getFirstSync<{ dname: string, item: string, meta: number }>("select container_display_name as dname,item,meta from fluid_container,item_panel where item_panel.item_name = fluid_container.item and fluid_container.meta = item_panel.item_meta and fluid_container.fluid_name=$fluid_name",
            { $fluid_name: getFluidNameFromNBT(item.nbtobj) }
        )
        dname = q?.dname?.replace("单元", "").replace("胶囊", "").replace("桶", "");
        if (q?.item != null) {
            item.name = q.item;
            item.meta = q.meta;
        }
    }
    let sql = `select icon, dname from item_panel where item_name = $item_name and item_meta = $item_meta;`;
    let image = db.getFirstSync<{ icon: Uint8Array, dname: string }>(sql, { $item_name: item.name, $item_meta: item.meta });
    let icon = null;
    if (image != null) {
        icon = String.fromCharCode.apply(null, image.icon);
        if (dname === null) {
            dname = image.dname;
        }
    }
    return [dname, icon]
}

function AECraftingPlanView({ route, navigation }) {
    const db = useSQLiteContext();
    const { craftingPlan, itemStack } = route.params
    const [craftingTaskItem, setCraftingTaskItem] = useState<CraftingTaskItem[]>(craftingPlan.plan);
    const [canCraft, setCanCraft] = useState(true);
    const [cpus, setCpus] = useState([]);
    const [isFocus, setIsFocus] = useState(false);
    const [value, setValue] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [allowMissing, setAllowMissing] = useState(false);
    const stylesDropDown = StyleSheet.create({
        container_dropdown: {
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between'
        }, 
        container: {
            backgroundColor: 'white',
            padding: 16,
        },
        dropdown: {
            height: 50,
            width: Dimensions.get('window').width * 0.75,
            borderColor: 'gray',
            borderWidth: 0.5,
            borderRadius: 8,
            paddingHorizontal: 8,
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

    const serverInfo = useContext(ServerInfoContext)
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState<string>("");
    const [scheme, setScheme] = useState<number>(null);
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState<{ dimid: number, x: number, y: number, z: number }>({} as any);
    useEffect(() => {
        console.log(serverInfo);
        const { ip, scheme, uuid, mainnet, port } = JSON.parse(serverInfo)
        setIP(ip);
        setScheme(scheme);
        setUUID(uuid);
        setNetworks(mainnet);
        if (port != null) {
            setPort(port)
        } else {
            setPort("44444");
        }
    }, [])

    function renderItem({ index, item }) {
        const [dname, icon] = loadItemSingle(db, item);
        return (
            <Card style={{ flex: 1, flexDirection: 'column', backgroundColor: !item.missing ? '#00FF00' : '#FF0000' }}>
                <Card.Header title={(<Text style={{ fontSize: 10 }}>{dname}</Text>)} thumb={(<Image style={{ width: 32, height: 32 }} source={icon != null ? { uri: `data:image/png;base64,${icon}` } : require('./barrier.png')}></Image>)}>
                </Card.Header>
                <Card.Body>
                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        {<Text style={{ fontSize: 10 }}>目前有:{formatItemCount(item.numberPresent)}</Text>}
                        {<Text style={{ fontSize: 10 }}>{item.missing > 0 ? `缺失:${formatItemCount(item.missing)}` : `计划合成:${formatItemCount(item.numberRemainingToCraft)}`}</Text>}
                    </View>
                </Card.Body>
            </Card>
        )
    }

    useEffect(() => {
        if (ip == null || scheme == null) {
            return;
        }
        for (var i = 0; i < craftingPlan.plan.length; i++) {
            if (craftingPlan.plan[i].missing > 0) {
                setCanCraft(false);
                break;
            }
        }
        const { dimid, x, y, z } = networks;
        let url = `${scheme}://${ip}:${port}/AE2/getCraftingCpuInfoNoSSE?ownerUUID=${uuid}&x=${x}&y=${y}&z=${z}&dimid=${dimid}`;

        fetch(url).then(resp => {
            resp.json().then(j => {
                if (j.succeed) {
                    setCpus(j.body);
                    let arr = (j.body as any[]);
                    arr = arr.filter(cpu => {
                        return cpu.storage > craftingPlan.bytesUsed && cpu.item == null;
                    })
                    console.log(arr);
                    if (arr.length <= 0) {
                        setCanCraft(false);
                    }
                    setCpus(arr);
                }
            }).catch(e => {
                console.log(e);
            })
        })
    }, [ip])

    //            
    return (<View style={styles.container}>
        <ActivityIndicator toast animating={submitting} size="large" text="正在提交合成任务" />
        <Button title="确认合成计划" disabled={!canCraft && !allowMissing} onPress={() => {
            setSubmitting(true);
            const { dimid, x, y, z } = networks;
            var params = {
                'ownerUUID': uuid,
                'x': x,
                'y': y,
                'z': z,
                'dimid': dimid,
                'cpuId': value + '',
                count: itemStack.count,
                item: itemStack.item_name,
                meta: itemStack.meta,
                nbt: itemStack.nbt,
                'allowMissing': allowMissing
            }
            fetch(`${scheme}://${ip}:${port}/AE2/startCraftingJob`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: encode(params)
                }).then(e => {
                    setSubmitting(false);
                    e.json().then(j => {
                        if (j.succeed) {
                            navigation.popToTop();
                            alert("合成任务提交成功");
                        } else {
                            console.log(j);
                            alert("合成任务提交失败");
                        }
                    })
                }).catch(e => {
                    console.log("提交出错" + e);
                    setSubmitting(false);
                    alert("合成任务提交失败");
                })
            console.log("开始合成 " + JSON.stringify(itemStack));
        }} />
        <View style={stylesDropDown.container_dropdown}>
            <Dropdown
                style={[stylesDropDown.dropdown, isFocus && { borderColor: 'blue' }]}
                placeholderStyle={stylesDropDown.placeholderStyle}
                selectedTextStyle={stylesDropDown.selectedTextStyle}
                inputSearchStyle={stylesDropDown.inputSearchStyle}
                iconStyle={stylesDropDown.iconStyle}
                data={cpus.map((cpu, idx) => {
                    return {
                        label: `CPU #${cpu.idx} - ${cpu.cpuName}, ${cpu.storage} 字节`,
                        value: cpu.idx
                    }
                })}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? (cpus.length > 0 ? '选择一个CPU' : '没有可用的合成cpu') : '...'}
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
                        style={stylesDropDown.icon}
                        color={isFocus ? 'blue' : 'black'}
                        name="Safety"
                        size={20}
                    />
                )}
            />
        <Checkbox onChange={(e) => {
            setAllowMissing(e.target.checked)
            }}>缺失</Checkbox>
        </View>

        <FlexGrid keyExtractor={(item, index) => index.toString()}
            data={craftingTaskItem}
            renderItem={renderItem}
            virtualization={true}
            virtualizedBufferFactor={4}
            maxColumnRatioUnits={3}
            itemSizeUnit={108}
            showScrollIndicator={true}
            style={{ flex: 1, alignItems: 'center' }}
            itemContainerStyle={{ borderStyle: 'solid', borderWidth: 1 }} />
    </View>);
}

function AECraftingDetailView({ route, navigation }) {
    const db = useSQLiteContext();
    const [craftingTaskItem, setCraftingTaskItem] = useState<CraftingTaskItem[]>([]);

    const serverInfo = useContext(ServerInfoContext)
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState("");
    const [scheme, setScheme] = useState<string>('http');
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState<{ dimid: number, x: number, y: number, z: number }>({} as any);
    const [isConnected, setIsConnected] = useState(false);
    let es = null;

    useEffect(() => {
        const { ip, scheme, uuid, mainnet, port } = JSON.parse(serverInfo)
        setIP(ip);
        setScheme(scheme);
        setUUID(uuid);
        setNetworks(mainnet);
        if (port != null) {
            setPort(port)
        } else {
            setPort("44444");
        }
    }, [])

    function renderItem({ index, item }) {
        return (
            <Card style={{ flex: 1, flexDirection: 'column', backgroundColor: item.numberSent > 0 ? '#00FF80' : (item.numberRemainingToCraft > 0 ? '#FFFE00' : '#FFFFFF') }}>
                <Card.Header title={(<Text style={{ fontSize: 9 }}>{item.dname}</Text>)} thumb={(<Image style={{ width: 24, height: 24 }} source={item.icon != null ? { uri: `data:image/png;base64,${item.icon}` } : require('./barrier.png')}></Image>)}>
                </Card.Header>
                <Card.Body>
                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        {item.numberPresent > 0 ? <Text style={{ fontSize: 10 }}>目前有:{formatItemCount(item.numberPresent)}</Text> : <View></View>}
                        {item.missing > 0 ? <Text style={{ fontSize: 10 }}>{`缺失:${formatItemCount(item.missing)}`})</Text> : <View />}
                        {item.numberRemainingToCraft > 0 ? <Text style={{ fontSize: 10 }}>{`计划合成:${formatItemCount(item.numberRemainingToCraft)}`}</Text> : <View />}
                        {(item.numberSent > 0 ? <Text style={{ fontSize: 10 }}>{`正在合成:${formatItemCount(item.numberSent)}`}</Text> : <View />)}
                    </View>
                </Card.Body>
            </Card>
        )
    }

    function getData() {
        const { cpuid } = route.params;
        if (ip == null && scheme != null) {
            return;
        }
        const { dimid, x, y, z } = networks;
        var es: EventSource = new EventSource(`${scheme}://${ip}:${port}/AE2/getCraftingDetails?ownerUUID=${uuid}&x=${x}&y=${y}&z=${z}&dimid=${dimid}&cpuid=${cpuid}`)
        es.addEventListener("message", (event) => {
            var resp = JSON.parse(event.data);
            if (resp.succeed) {
                setIsConnected(true)
                let itemList = resp.body
                itemList.forEach(e => {
                    const [dname, icon] = loadItemSingle(db, e);
                    e.dname = dname;
                    e.icon = icon;
                })
                setCraftingTaskItem(itemList);
            } else {
                es.close();
            }
        });
        es.addEventListener("close", (event) => {
            setIsConnected(false)
            console.log("connection closed");
        })
        es.addEventListener("open", (event) => {
            console.log("connection open");
        })
        es.addEventListener("error", (event) => {
            setIsConnected(true)
            es.removeAllEventListeners();
            es.close();
        })
        return es;
    }

    useEffect(() => {
        const { cpuid } = route.params;
        setTimeout(() => {
            es = getData();
        }, 200)
        navigation.addListener('focus', () => {
            console.log(`进入当前页面 cpu#${cpuid}`)
            setTimeout(() => {
                es = getData();
            })
        })
        navigation.addListener('blur', () => {
            console.log(`离开当前页面 cpu#${cpuid}`)
            es?.close();
        })
        return () => {
            es?.close();
        }
    }, [ip, navigation])
    //            
    return (<View style={styles.container_button_right}>
        <View style={{ width: Dimensions.get('window').width, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => { setIsConnected(false); es?.close(); es = getData() }}>
                {isConnected ? <AntDesign size={32} style={{ color: '#00FF7F' }} name="link" /> : <AntDesign size={32} style={{ color: '#FF0000' }} name="disconnect" />}
            </TouchableOpacity>
            <Button onPress={() => {
                const { cpuid } = route.params;
                const { dimid, x, y, z } = networks;
                var params = {
                    'ownerUUID': uuid,
                    'x': x,
                    'y': y,
                    'z': z,
                    'dimid': dimid,
                    'cpuid': cpuid + ''
                }
                fetch(`${scheme}://${ip}:${port}/AE2/cancelTask`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: encode(params)
                }).then((e) => {
                    e.json().then(e => {
                        console.log(e);
                    })
                    alert('成功取消操作');
                })
            }} title="取消合成"></Button></View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <FlexGrid keyExtractor={(item, index) => index.toString()}
                data={craftingTaskItem}
                renderItem={renderItem}
                virtualization={true}
                virtualizedBufferFactor={1}
                maxColumnRatioUnits={Math.floor(Dimensions.get('window').width / 108)} itemSizeUnit={108}
                showScrollIndicator={true}
                style={{ flex: 1, alignItems: 'center' }}
                itemContainerStyle={{ borderStyle: 'solid', borderWidth: 1, flexGrow: 0 }} />
        </View>
    </View>);
}

function AECraftingCPUView({ route, navigation }) {
    const [craftingCPUs, setCraftingCPUs] = useState([
        { idx: 1, cpuName: '正在载入,请等待', storage: 0, parallelism: 0, meta: 0, nbt: undefined, item: undefined, remainingCount: 0 }
    ]);

    const db = useSQLiteContext();

    const serverInfo = useContext(ServerInfoContext)
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState<string>("");
    const [scheme, setScheme] = useState<string>('http');
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState<{ dimid: number, x: number, y: number, z: number }>({} as any);
    useEffect(() => {
        const { ip, scheme, uuid, mainnet, port } = JSON.parse(serverInfo)
        setIP(ip);
        setScheme(scheme);
        setUUID(uuid);
        setNetworks(mainnet);
        if (port != null) {
            setPort(port)
        } else {
            setPort("44444");
        }
    }, [])

    function getData() {
        const { dimid, x, y, z } = networks;
        var es = new EventSource(`${scheme}://${ip}:${port}/AE2/getCraftingCpuInfo?ownerUUID=${uuid}&x=${x}&y=${y}&z=${z}&dimid=${dimid}`)
        es.addEventListener("message", (event) => {
            var resp = JSON.parse(event.data);
            if (resp.succeed) {
                var j = JSON.parse(event.data);
                if (j.succeed) {
                    if (j.body.length > 0) {
                        setCraftingCPUs(j.body);
                    } else {
                        setCraftingCPUs([{ idx: 1, cpuName: '正在载入,请等待', storage: 0, parallelism: 0, nbt: undefined, meta: 0, item: undefined, remainingCount: 0 }]);
                    }
                } else {
                    es.close()
                }
            } else {
                console.log(event.data);
                es.close();
            }
        });
        es.addEventListener("close", (event) => {
            console.log("connection closed");
        })
        es.addEventListener("open", (event) => {
            console.log("connection open");
        })
        es.addEventListener("error", (event) => {
            es.removeAllEventListeners();
            es.close();
        })
        return es;
    }
    useEffect(() => {
        if (ip == null || scheme == null) {
            return;
        }
        var es = getData();
        const focus = navigation.addListener("focus", (ev) => {
            //console.log('进入当前页面')
            setTimeout(() => {
                es = getData();
            }, 200)
        })

        const blur = navigation.addListener('blur', () => {
            //console.log('离开当前页面')
            es.close();
        })
        return () => {
            es.close();
        }
    }, [scheme, ip, navigation]);
    return (
        <CraftingCPUSideTab.Navigator initialRouteName={craftingCPUs[0].cpuName} defaultStatus="open">
            {
                craftingCPUs.map((cpu, idx) => {
                    var itemDisplayName = "";
                    let o = cpu as any
                    o.name = o.item;
                    const [dname, icon] = loadItemSingle(db, o as CraftingTaskItem);
                    if (dname != undefined) itemDisplayName = dname;
                    function ic({ focused, size }) {
                        return (<Image style={{ height: size, width: size }} source={{ uri: `data:image/png;base64,${icon}` }}></Image>)
                    }
                    return <CraftingCPUSideTab.Screen options={{ drawerIcon: ic }} initialParams={{ cpuid: idx }} key={idx} name={`CPU: #${idx}-${cpu.cpuName} ${cpu.item != undefined ? '合成:' + itemDisplayName : '倪哥正在摸鱼'}`} component={AECraftingDetailView} />
                }
                )}
        </CraftingCPUSideTab.Navigator>);
}
function AEItemDetailView({ route, navigation }) {
    const [count, setCount] = useState(0);

    const serverInfo = useContext(ServerInfoContext)
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState<string>("");
    const [scheme, setScheme] = useState<string>('http');
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState<{ dimid: number, x: number, y: number, z: number }>({} as any);

    const [calculating, setCalculating] = useState(false);

    const [spinValue, setSpinValue] = useState(new Animated.Value(0));

    const loadingAnimation = Animated.loop(Animated.timing(spinValue, {
        toValue: 3,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
    }));

    const spin1 = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    })

    useEffect(() => {
        const { ip, scheme, uuid, mainnet, port } = JSON.parse(serverInfo)
        setIP(ip);
        setScheme(scheme);
        setUUID(uuid);
        setNetworks(mainnet);
        if (port != null) {
            setPort(port)
        } else {
            setPort("44444");
        }
    }, [])
    let es: EventSource = null;
    const { item, icon } = route.params
    let itemstack = JSON.parse(item) as ItemStack;
    const { item_name, meta, original_name, original_meta, nbt } = itemstack;
    let uname = original_name != undefined ? original_name : item_name;
    let umeta = original_meta != undefined ? original_meta : meta;
    itemstack.item_name = uname;
    itemstack.meta = umeta;

    function goBackAlert() {
        Alert.alert('注意', '此时返回将会丢失正在生成的合成计划', [
            {
                text: '确定',
                onPress: () => {
                    es?.close();
                    setCalculating(false);
                    navigation.goBack();
                },
            },
            {
                text: '取消', onPress: () => {

                }
            },
        ])
    }
    return (<View style={styles.ItemDetail}>
        <Animated.Image style={{
            transform: [{ rotate: spin1 }
            ], width: Dimensions.get('window').width / 2, height: Dimensions.get('window').width / 2
        }} source={{ uri: `data:image/png;base64,${icon}` }} />
        <Text style={{ fontSize: 32 }}>{`名称: ${itemstack.dname}`}</Text>
        <Text style={{ fontSize: 32 }}>{`注册名: ${uname}`}</Text>
        <Text style={{ fontSize: 32 }}>{`metadata: ${umeta}`}</Text>
        {nbt != undefined ? <Text>{`nbt:${JSON.stringify(itemstack.nbtobj)}`}</Text> : <View />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 32 }}>合成数量:</Text>
            <Input maxLength={20} style={{ fontSize: 32, padding: 5 }} placeholder="请输入合成数量" onChangeText={(text) => {
                try {
                    setCount(parseInt(text));
                } catch (e) {
                    console.log(e);
                }
            }}></Input>
        </View>

        <View style={{ flexDirection: 'row', columnGap: 30 }}>
            <AntButton type='primary' disabled={calculating} onPress={() => {
                if (Number.isNaN(count) || count <= 0) {
                    alert('请输入正确的数值')
                    return;
                }
                if (uname != 'ae2fc:fluid_drop' && count > 50000) {
                    alert('你输入的数字太大了，为了防止打崩服务器，除流体外不能下这么大的单子。')
                    return;
                }
                loadingAnimation.start();
                setCalculating(true);

                const { dimid, x, y, z } = networks;
                var params = {
                    'ownerUUID': uuid,
                    'x': x,
                    'y': y,
                    'z': z,
                    'dimid': dimid,
                    'item': uname,
                    'meta': umeta + '',
                    'nbt': nbt,
                    'count': count + ''
                }
                es = new EventSource(`${scheme}://${ip}:${port}/AE2/generateCraftingPlan`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: encode(params)
                })
                es.addEventListener('message', (event) => {
                    let data = JSON.parse(event.data)
                    if (typeof (data.body) != 'string') {
                        data.body.plan.sort((a, b) => b.missing - a.missing)
                        console.log(event.data)
                        loadingAnimation.stop();
                        itemstack.count = count;
                        setCalculating(false);
                        es.close();
                        navigation.navigate('AECraftingPlanView', { craftingPlan: data.body, itemStack: itemstack });
                    }
                })
                es.addEventListener('close', (event) => {
                    console.log('放弃合成计划')
                    setCalculating(false);
                })
                es.addEventListener('error', (event) => {
                    alert("获取合成计划失败" + event.type);
                    loadingAnimation.stop();
                    setCalculating(false);
                })

            }}>合成</AntButton>
            <AntButton type='primary' disabled={calculating} onPress={() => { if (calculating) { goBackAlert() } else { navigation.goBack() } }}>返回</AntButton></View>

    </View >);
}

function AEItemView({ route, navigation }) {
    const [items, setItems] = useState<ItemStack[]>([]);
    const [rawItems, setRawItems] = useState<ItemStack[]>([]);
    const db = useSQLiteContext();

    const serverInfo = useContext(ServerInfoContext);
    const fluidInfo = useContext(FluidInfoContext);
    const [ip, setIP] = useState<string>(null);
    const [port, setPort] = useState<string>("");
    const [scheme, setScheme] = useState<string>('http');
    const [uuid, setUUID] = useState(null);
    const [networks, setNetworks] = useState<{ dimid: number, x: number, y: number, z: number }>({} as any);

    const [sortAsc, setSortAsc] = useState(false);

    const [sortMode, setSortMode] = useState(0);

    const [showAll, setShowAll] = useState(false);

    const [keyword, setKeyword] = useState("");

    const [filter, setFilter] = useState<Set<string>>(new Set());

    const [loadedItem, setLoadedItem] = useState({});

    const [isConnected, setIsConnected] = useState(false);

    let es = null;


    useEffect(() => {
        spin();
    }, [])
    useEffect(() => {
        console.log(serverInfo)
        console.log(typeof (serverInfo))
        if (serverInfo === "null") {
            return;
        }
        const { ip, scheme, uuid, mainnet, port } = JSON.parse(serverInfo)
        setIP(ip);
        setScheme(scheme);
        setUUID(uuid);
        setNetworks(mainnet);
        if (port != null) {
            setPort(port)
        } else {
            setPort("44444");
        }
    }, [serverInfo])

    const [spinValue, setSpinValue] = useState(new Animated.Value(0));

    const spin = () => {
        setSpinValue(prev => {
            prev.setValue(0);
            return prev;
        })
        return Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true
        }).start(() => spin());
    }
    const spin1 = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    })



    function ItemImageView(item) {
        let itemstack = item as ItemStack;
        let loaded = loadedItem[itemstack.item_name + ":" + itemstack.meta];
        let dname = loaded.dname;
        if (dname.includes("超时空金属") || dname.includes("超立方体") || itemstack.item_name.includes('singularity') || itemstack.item_name == 'Avaritia:Singularity') {
            return (<Animated.Image style={{
                width: 48, height: 48, transform: [
                    { rotate: spin1 }
                ]
            }} source={loadedItem[itemstack.item_name + ":" + itemstack.meta] != null ? { uri: `data:image/png;base64,${loadedItem[itemstack.item_name + ":" + itemstack.meta].icon}` } : require('./barrier.png')} />)

        } else {
            return (<Image style={{ width: 48, height: 48 }} source={loadedItem[itemstack.item_name + ":" + itemstack.meta] != null ? { uri: `data:image/png;base64,${loadedItem[itemstack.item_name + ":" + itemstack.meta].icon}` } : require('./barrier.png')}></Image>)
        }
    }


    function renderItem({ index, item }) {
        let itemstack = replaceAE2FC(item as ItemStack, fluidInfo, loadedItem);
        itemstack.dname = loadedItem[itemstack.item_name + ":" + itemstack.meta]?.dname;
        return (
            <TouchableOpacity key={item[0]} onPress={() => {
                if (item.craftable) {
                    navigation.navigate('AEItemDetailView', { item: JSON.stringify(item), icon: loadedItem[itemstack.item_name + ":" + itemstack.meta]?.icon })
                };
            }}>
                <View style={{ flexDirection: 'column' }}>
                    {!loadedItem.hasOwnProperty(itemstack.item_name + ":" + itemstack.meta) ?
                        <Animated.View style={{
                            transform: [
                                { rotate: spin1 }
                            ]
                        }}><AntDesign name="loading1" size={48} color="black" />
                        </Animated.View> :
                        ItemImageView(item)}
                    <View style={{ flexDirection: 'row' }}>
                        <Text>{formatItemCount(item.count)}</Text>
                        {item.craftable ? <Image style={{ width: 16, height: 16 }} source={require('./forge.png')}></Image> : <View />}
                    </View>
                </View>

            </TouchableOpacity>
        )
    }
    function compareItem(a: ItemStack, b: ItemStack) {
        var r = 0;
        if (sortMode % 3 === 0) {
            r = a.item_name.split(":")[0] >= b.item_name.split(":")[0] ? 1 : 0;
        } else if (sortMode % 3 == 1) {
            r = a.count - b.count;
        } else if (sortMode % 3 == 2) {
            r = a.item_name.split(":")[1] >= b.item_name.split(":")[1] ? 1 : 0;
        }
        if (!sortAsc) r = -r;
        return r;
    }
    function getData() {
        const { dimid, x, y, z } = networks;
        var es: EventSource = new EventSource(`${scheme}://${ip}:${port}/AE2/getItems?ownerUUID=${uuid}&x=${x}&y=${y}&z=${z}&dimid=${dimid}&craftableOnly=${!showAll}`)
        es.addEventListener("message", (event) => {
            var resp = JSON.parse(event.data);
            if (resp.succeed) {
                let itemList = resp.body as ItemStack[]
                itemList = itemList.map(e => {
                    if (e.nbt != undefined && e.item_name.includes("ae2fc")) {
                        e.nbtobj = NBT.Reader(base64ToArrayBuffer(e.nbt));
                    }
                    return e
                })
                //console.log(JSON.stringify(fluidInfo));
                //[r.item_name, r.amount, r.meta];
                let querySet = new Set()
                itemList.forEach(i => querySet.add('\'' + i.item_name.replace('\'', "''") + '\''));
                Object.keys(fluidInfo).forEach((k) => {
                    querySet.add('\'' + fluidInfo[k][0] + '\'');
                })
                let tojoin = [];
                querySet.forEach(i => tojoin.push(i));
                let sql = `select concat(item_name, ':', item_meta) as key, icon, dname from item_panel where item_name in (${tojoin.join(",")});`;
                db.getAllAsync<{ key: string, icon: Uint8Array, dname: string }>(sql).then(
                    data => {
                        setLoadedItem(prevState => {
                            let newState = { ...prevState }
                            data.forEach(entry => {
                                newState[entry.key] = { icon: String.fromCharCode.apply(null, entry.icon), dname: entry.dname };
                            })
                            return newState;
                        })
                    }
                ).catch(e => {
                    console.log(e);
                });
                setRawItems(itemList);
                console.log("物品页-连接")
                setIsConnected(true)
            } else {
                console.log(event.data);
                es.close();
            }
        });
        es.addEventListener("close", (event) => {
            console.log("close: 物品页-断开")
            setIsConnected(false)
        })
        es.addEventListener("open", (event) => {
            console.log("connection open");
        })
        es.addEventListener("error", (event) => {
            es.removeAllEventListeners();
            setIsConnected(false)
            console.log("error: 物品页-断开")
            console.log(JSON.stringify(event))
            es.close();

        })
        return es;
    }
    useEffect(() => {
        es?.close()
        es = getData()
        return () => {
            es.close();
        }
    }, [ip]);
    useEffect(() => {
        let items = rawItems;
        if (keyword.length > 0) {
            items = items.filter(e => filter.has(e.item_name + ":" + e.meta))
        }
        setItems(items.sort(compareItem));
    }, [filter, rawItems, sortMode, sortAsc])

    useEffect(() => {
        if (keyword.length > 0) {
            let sql = `select concat(item_name, ':', item_meta) name from item_panel where dname like concat('%',$keyword, '%')`
            db.getAllAsync<{ name: string }>(sql, { $keyword: keyword }).then(resultSet => {
                let f = new Set<string>()
                resultSet.forEach(d => {
                    f.add(d.name)
                })
                setFilter(f)
            }).catch(e => {
                console.log(e);
            })
        }
    }, [keyword])
    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', columnGap: 10, width: Dimensions.get('window').width, justifyContent: 'flex-start' }}>
                <TouchableOpacity onPress={() => setSortAsc(!sortAsc)}>
                    {sortAsc ? <AntDesign name="arrowup" size={32} color="black" /> : <AntDesign name="arrowdown" size={32} color="black" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSortMode(sortMode + 1)}>
                    {
                        sortMode % 3 == 0 ? <Entypo name="email" size={32} color="black" /> : (sortMode % 3 == 1 ?
                            <MaterialIcons name="numbers" size={32} color="black" /> :
                            <FontAwesome6 name="arrow-down-a-z" size={32} color="black" />)}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                    {showAll ? <Octicons name="stack" size={32} color="black" /> : <FontAwesome5 name='hammer' size={32} color="black" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setIsConnected(false); es?.close(); es = getData() }}>
                    {isConnected ? <AntDesign size={32} style={{ color: '#00FF7F' }} name="link" /> : <AntDesign size={32} style={{ color: '#FF0000' }} name="disconnect" />}
                </TouchableOpacity>
                <TextInput style={{ fontSize: 32 }} placeholder="输入搜索关键词" onChangeText={(t) => setKeyword(t.trim().replace(' ', ''))} placeholderTextColor="#7F7F7F"></TextInput>
            </View>
            <FlexGrid data={items} renderItem={renderItem} itemSizeUnit={64} maxColumnRatioUnits={Math.floor(Dimensions.get('window').width / 64)} virtualization={true} virtualizedBufferFactor={1} showScrollIndicator={true} style={{ flex: 1, justifyContent: 'center' }} />
        </View>
    );
}

function AEItemStackedView({ route, navigation}) {
    return (
        <ItemViewStack.Navigator screenOptions={{headerTitle:""}}>
            <ItemViewStack.Screen name="AECraftableItems" component={AEItemView} options={{
                title: 'AE物品总览'
            }} />
            <ItemViewStack.Screen name="AEItemDetailView" component={AEItemDetailView} options={
                { title: 'AE合成物品详情' }
            } />
            <ItemViewStack.Screen name="AECraftingPlanView" component={AECraftingPlanView} options={
                { title: 'AE合成计划详情' }
            } />
            <ItemViewStack.Screen name="Settings" component={Settings} options={{
                title: '设置'
            }} />
        </ItemViewStack.Navigator>
    );
}

export default function AEView({ route, navigation}) {
    const [serverInfo, setServerInfo] = useState({
        ip: SecureStore.getItem('server.ip'),
        scheme: SecureStore.getItem('server.scheme'),
        uuid: SecureStore.getItem('user.uuid'),
        mainnet: JSON.parse(SecureStore.getItem('user.ae_main_net')),
        port: SecureStore.getItem('server.port')
    });
    const [fluidMapping, setFluidMapping] = useState({})
    const db = useSQLiteContext()
    const [ready, setReady] = useState(false);
    useEffect(() => {
        db.getAllAsync<{ fluid_name: string, item_name: string, amount: number, meta: string }>("select item_name, fluid_name, amount,fluid_container.meta as meta from fluid_container join item_panel on fluid_container.item=item_panel.item_name and fluid_container.meta = item_panel.item_meta").then(data => {
            let m = {};
            data.forEach(r => {
                m[r.fluid_name] = [r.item_name, r.amount, r.meta];
            })
            setFluidMapping(m);
            setReady(true);
        }).catch(e => console.log(e));
    }, [])

    function scrOptions({ route }) {
        return {
            headerShown: true,
            title: route.name == 'AEItemStackedView' ? 'AE物品总览' : '合成CPU监控',
            tabBarIcon: ({ focused, color, size }) => {
                return <Image source={route.name == 'AEItemStackedView' ? require("./assets/16384k.png") : require("./assets/MT-3662.png")} />
            },
            headerRight: () =>
            <Button title="设置" onPress={() => {
                navigation.navigate('Settings', {callback:() => {
                    setServerInfo({
                        ip: SecureStore.getItem('server.ip'),
                        scheme: SecureStore.getItem('server.scheme'),
                        uuid: SecureStore.getItem('user.uuid'),
                        mainnet: JSON.parse(SecureStore.getItem('user.ae_main_net')),
                        port: SecureStore.getItem('server.port')
                    });
                   console.log("Hi");
                }});
            }} />
        }
    }

    return (
        !ready ? <View /> :
            <ServerInfoContext.Provider value={JSON.stringify(serverInfo)}>
                <FluidInfoContext.Provider value={fluidMapping}>
                    <Tab.Navigator screenOptions={scrOptions}>
                        <Tab.Screen name="AEItemStackedView" component={AEItemStackedView} />
                        <Tab.Screen name="AECrafting" component={AECraftingCPUView} />
                    </Tab.Navigator>
                </FluidInfoContext.Provider>
            </ServerInfoContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    container_button_right: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
    },
    ItemDetail: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30
    }
});
