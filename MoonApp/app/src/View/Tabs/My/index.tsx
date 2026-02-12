import { Image, ScrollView, Text, TouchableOpacity, View,  } from "react-native";
import { ParamListBase } from "@react-navigation/native";
import {  NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuthStore, useDeviceStore } from "@/Store";
import { Cell, CellGroup } from "@/Components/Cell";
import styles from "./styles";
import Config from "@/Common/Config";


function MyPage({ navigation }: NativeStackScreenProps<ParamListBase, "My">) {
    const { userInfo } = useAuthStore()
    const { deviceCode, version } = useDeviceStore()

    return (
        <ScrollView style={ styles.wrapper }>
            <View style={ styles.header }>
                <Image
                    style={ styles.avatar }
                    source={{ uri: 'Avater' }}
                />
                <Text style={ styles.username }>{ userInfo?.username }</Text>
            </View>
            <CellGroup inset={ true }>
                <Cell 
                    icon="mobile"
                    label="设备码"
                    labelWidth={ 100 }
                    content={ deviceCode }
                />
                <Cell 
                    icon="secured"
                    label="账号与安全"
                    labelWidth={ 100 }
                    onClick={() => navigation.navigate('Profile') }
                    border={ false }
                    isLink
                />
                
            </CellGroup>
            <CellGroup inset={ true }>
                <Cell 
                    icon="setting"
                    label="设置"
                    labelWidth={ 100 }
                    onClick={() =>  navigation.navigate('Setting') }
                    isLink
                />
                <Cell 
                    icon="user-talk"
                    label="用户服务协议"
                    labelWidth={ 100 }
                    isLink
                    onClick={() => {
                        navigation.navigate('WebPage', Config.agreement)
                    }}
                />
                <Cell 
                    icon="tips"
                    label="隐私声明"
                    labelWidth={ 100 }
                    isLink
                    onClick={() => {
                        navigation.navigate('WebPage', Config.privacy)
                    }}
                />
                <Cell 
                    icon="info-circle"
                    label="版本"
                    labelWidth={ 100 }
                    content={ `Ver ` + version }
                    border={ false }
                />
            </CellGroup>
        </ScrollView>
    )
}

export default MyPage