import React,{ useEffect, useRef, useState } from 'react'
import { View, Switch, StyleSheet, Text, ActivityIndicator, FlatList, TouchableOpacity, Dimensions } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import BluetoothSerial from 'react-native-bluetooth-serial';
import { Button, Divider } from 'react-native-elements';
import Dialog, { DialogContent,  SlideAnimation,  DialogButton, DialogFooter } from 'react-native-popup-dialog';

const Bluetooth = () =>{
    const windowWidth = useRef(Dimensions.get('screen').width).current
    const [isBlEnable, setBlEnable] = useState(false)
    const [disconvering, setDisconvering] = useState(false)
    const [devices, setDevices] = useState([])
    const [connectedDevice, setConnectedDevice] = useState(null)
    const [unpairedDevices, setUnpairedDevices] = useState([])
    const [data, setData] = useState('')
    const [readData, setReadData] = useState('')
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [device, setDevice] = useState(null)
    const [screen, setScreen] = useState('paired')
    const [connectModal, setConnectModal] = useState({visible:false,device:{name:'',id:'',class:''}})

    useEffect(()=>{
        Promise.all([BluetoothSerial.isEnabled(), BluetoothSerial.list()]).then(values=>{
            const [isEnabled, allDevices] = values
            console.log('Is Blutooteh Enabled : '+isEnabled)
            setBlEnable(isEnabled)
            setDevices(allDevices)
        })
        BluetoothSerial.on("bluetoothEnabled", () =>
            console.log("Bluetooth enabled")
        );

        BluetoothSerial.on("bluetoothDisabled", () =>
            console.log("Bluetooth disabled")
        );

        BluetoothSerial.on("error", err => {
            console.log("error", err);
        });

        BluetoothSerial.on("connectionLost", () => {
        if (device) {
                connectDevice(device)
            .then(res => {})
            .catch(err => {
                console.log("error", err);
            });
        }
        });
    },[])

    const pairedDevices = () =>{
        setTimeout(() => {  
            Promise.all([BluetoothSerial.isEnabled(), BluetoothSerial.list()]).then(values=>{
                const [isEnabled, allDevices] = values
                if(isEnabled){
                    setDevices(allDevices)
                }
                else pairedDevices()
            })
        }, 200);
    }

    const toggleSwitch = () =>{
        if(isBlEnable){
            disableBl()
        }
        else{
            enableBl()
        }
    }

    const enableBl = () =>{
        BluetoothSerial.enable()
        .then((res) => setBlEnable(true))
        .catch((err) => console.log(err.message))
    }

    const disableBl = () =>{
        BluetoothSerial.disable()
        .then((res) => setBlEnable(false))
        .catch((err) => console.log(err.message))
    }

    const discoverUnpaired = () =>{
        if(disconvering) return true
        setDisconvering(true)
        console.log('started discoveriong unpaired devices and bl is :'+ isBlEnable)
        BluetoothSerial.discoverUnpairedDevices()
        .then((unpairedDevices) => {
            console.log('here is unpaired devices :' + unpairedDevices)
            setUnpairedDevices(unpairedDevices)
            setDisconvering(false)              
            console.log('done discovering unpaired')
        })
        .catch((err) => console.log(err.message))
    }

    const cancelDiscovery = () =>{
        if(!disconvering) return true
        BluetoothSerial.cancelDiscovery()
        .then(() => {
            setDisconvering(false)
            console.log('cancel discovery of unpaired devices')
        })
        .catch((err) => console.log(err.message))
    }

    const pairDevice = (device) =>{
        BluetoothSerial.pairDevice(device.id)
        .then((paired) => {
        if (paired) {
            console.log(`Device ${device.name} paired successfully`)
            const devices = this.state.devices
            devices.push(device)
            this.setState({ devices, unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id) })
        } else {
            console.log(`Device ${device.name} pairing failed`)
        }
        })
        .catch((err) => console.log(err.message))
    }

    const connectDevice = async(device) =>{
        setConnecting(true)
        setConnectModal({visible:false,device:connectModal.device})

        disconnectDevice()

        const allDevices = devices.filter((data)=>data.id!==device.id).map((data,index)=>{
            return {...data,connecting:false}
        })
        const cdevice = device
        cdevice['connecting'] = true
        console.log('here is device that updated',cdevice)
        allDevices.unshift(cdevice)
        setDevices(allDevices)

        BluetoothSerial.connect(device.id)
        .then((res) => {
            console.log(res)
            setConnectedDevice(device)
            const allDevices = devices.filter((data)=>data.id!==device.id).map((data,index)=>{
                return {...data,connecting:false}
            })
            const connecteddevice = device
            cdevice['connected'] = true
            cdevice['connecting'] = false
            allDevices.unshift(connecteddevice)
            setDevices(allDevices)
            setConnecting(false)
        })
        .catch((err) => {
            const allDevices = devices.map((data,index)=>{
                return {...data,connecting:false,connected:false}
            })
            setDevices(allDevices)
            console.log(err.message)})
    }

    const askConnect = (device) =>{
        setConnectModal({visible:true,device:device})
    }

    const disconnectDevice = () =>{
        BluetoothSerial.disconnect()
        .then(() => {
            const allDevices = devices.map((data,index)=>{
                return {...data,connected:false}
            })
            setDevices(allDevices)
        })
        .catch((err) => console.log(err.message))
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={()=>askConnect(item)}  activeOpacity={0.5} style={styles.blItem}>
            <Text style={{fontWeight:'bold',fontSize:16}}>{item.name}</Text>
            <Text>{item.connected? 'Connected' : item.connecting? 'Connecting...':item.id}</Text>
        </TouchableOpacity>
    );

    const toggleScreen = () =>{
        if(screen==='paired'){
            setScreen('unmpaired')
            if(isBlEnable) discoverUnpaired()  
        }
        else{
            setScreen('paired')
            if(isBlEnable) cancelDiscovery()
        }
    }

    const writeData = () =>{
        Bluetooth.write('Working now').then(value=>{
            console.log(value)
        }).catch((e)=>{
            console.log(e)
        })
    }

    useEffect(()=>{
        if(isBlEnable){
            pairedDevices()
        }
        if(isBlEnable && screen!=='paired' && !disconvering){
            discoverUnpaired()
        }
    },[isBlEnable])

    return(
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={{fontSize:20,fontWeight:'bold'}}>Connect Device</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isBlEnable ? 'green' : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitch}
                    value={isBlEnable}
                />
            </View>
            <View style={styles.buttons}>
                <Button type={screen==='paired'? 'outline':'solid'} containerStyle={{width:'48%'}} buttonStyle={{borderWidth:1}} titleStyle={{fontSize:18}} onPress={()=>toggleScreen()} title='Paired Devices'/>
                <Button type={screen!=='paired'? 'outline':'solid'} containerStyle={{width:'48%'}} buttonStyle={{borderWidth:1}} titleStyle={{fontSize:18}} onPress={()=>toggleScreen()} title='Unpaired Devices'/>                
            </View>
                <Button type={'outline'} buttonStyle={{borderWidth:1}} titleStyle={{fontSize:18}} onPress={()=>writeData()} title='Write Data to App'/>
            <View style={styles.content}>
                {!isBlEnable?
                    <View style={styles.messagePage}>
                        {/* <Icon name='bluetooth' size={30}/> */}
                        <Text style={{fontSize:18}}>Please Turn On Bluetooth</Text>
                    </View>
                :
                    <>
                    {screen==='paired'?
                        <>
                        {devices.length?
                            <FlatList
                                data={devices}
                                renderItem={renderItem}
                                keyExtractor={item=> item.id}
                            />
                        :
                          <View style={styles.messagePage}>
                              <Text style={{fontSize:18}}>No Device Found</Text>
                          </View>
                        }
                        </>
                    :
                        <View style={{flex:1}}>
                            {disconvering?
                                <View style={{flexDirection:'row',paddingVertical:10,paddingHorizontal:30,justifyContent:'space-between',alignItems:'center'}}>
                                    <Text>Searching for devices...</Text>
                                    <ActivityIndicator size={20} color={'black'}/>
                                </View>
                            :null
                            }
                            {unpairedDevices.length?
                                <FlatList
                                   data={unpairedDevices}
                                   renderItem={renderItem}
                                   keyExtractor={item=>item.id}
                                />
                            :
                                <>
                                {disconvering?
                                    <>
                                    </>
                                :
                                    <View style={styles.messagePage}>
                                        <Text style={{fontSize:18}}>No Device Found</Text>
                                    </View>
                                }
                                </>
                            }
                        </View>
                    }
                    </>
                }
            </View>
            <Dialog
                visible={connectModal.visible}
                onTouchOutside={() => {
                    setConnectModal({visible:false,device:connectModal.device})
                }}
                dialogAnimation={new SlideAnimation({
                    slideFrom: 'bottom',
                })}
                hasOverlay={true}

                footer={
                    <DialogFooter>
                        <DialogButton
                            text="CANCEL"
                            onPress={() => {}}
                        />
                        <DialogButton
                        text="OK"
                        onPress={() => connectDevice(connectModal.device)}
                        />
                    </DialogFooter>
                }
                width={windowWidth-30}
            >
                <DialogContent>
                   <View>
                       <Text style={{textAlign:'center',fontSize:20,marginTop:15,fontWeight:'bold'}}>{connectModal.device.name}</Text>
                       <Divider style={{marginVertical:10}}/>
                       <Text numberOfLines={2} style={{fontSize:18}}>Do you really want to connect with {connectModal.device.name}.</Text>
                   </View>
                </DialogContent>
            </Dialog>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
    },
    header:{
        flexDirection:'row',
        justifyContent:'space-between',
        width:'100%',
        paddingHorizontal:10,
        height:70,
        alignItems:'center',
        backgroundColor: 'white',
        elevation:3
    },
    buttons:{
        flexDirection:'row',
        justifyContent:'space-around',
        paddingVertical:15
    },
    content:{
        flex:1
    },
    messagePage:{
        flex:1,
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center'
    },
    blItem:{
        display:'flex',
        flexDirection:'row',
        justifyContent:'space-between',
        paddingHorizontal:10,
        paddingVertical:16,
        backgroundColor:'white',
        marginVertical:3,
        marginHorizontal:10,
        borderRadius:10
    }
})
export default Bluetooth