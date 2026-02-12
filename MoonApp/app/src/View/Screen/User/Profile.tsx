import { Alert, Text } from "react-native";
import { Cell, CellGroup } from "@/Components/Cell";
import { AuthActions, useAuthStore, useDeviceStore } from "@/Store";
import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useToast } from "@/Components/Toast";
import styles from "./styles";
import { KeyboardDismissWrapper } from "@/Components/Field";

export function Profile({ navigation }: NativeStackScreenProps<ParamListBase, "Profile"> ) {
    const { userInfo } = useAuthStore()
    const { countDays } = useDeviceStore()
    const toast = useToast()

    return (
        <KeyboardDismissWrapper behavior="padding" style={ styles.wrapper }>
            <CellGroup inset border>
                <Cell 
                    label="用户名"
                    labelWidth={ 100 }
                    content={ userInfo?.username }
                />
                <Cell 
                    label="注册时间"
                    labelWidth={ 100 }
                    content={ userInfo?.createdAt }
                />
                <Cell
                    label="剩余天数"
                    labelWidth={ 100 }
                    content={ countDays + '天' }
                    border={false}
                />
            </CellGroup>

            <CellGroup inset border>
                <Cell
                    label="修改密码"
                    isLink
                    onClick={ () => {
                        navigation.navigate('Password')
                    }}
                />
                <Cell
                    rendlerLabel={
                        <Text style={ styles.logoutText }>退出登录</Text>
                    }
                    border={ false }
                    onClick={ () => {
                        Alert.alert('提示', '确定要退出登录吗？', [
                            { text: '取消', },
                            { text: '登出', style: "destructive", onPress: async () => {
                                await AuthActions.userLogout()
                                toast.info('成功退出登录', { duration: 1000 })
                            }}
                        ])
                    }}
                />
            </CellGroup>

            {/* <CellGroup border>
                <Cell
                    label="注销账号"
                    isLink
                    border={false}
                />
            </CellGroup> */}
        </KeyboardDismissWrapper>
    )
}