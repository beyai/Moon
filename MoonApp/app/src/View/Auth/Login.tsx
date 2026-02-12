import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "@/Components/Button";
import { CellGroup } from "@/Components/Cell";
import { Field, KeyboardDismissWrapper } from "@/Components/Field";
import { Check } from "@/Components/Check";
import { useToast } from "@/Components/Toast";
import { AuthActions, useAuthStore } from '@/Store';
import styles from "./styles";
import Config from '@/Common/Config';

function LoginPage({ navigation }: NativeStackScreenProps<ParamListBase, "Login">) {
    const toast = useToast()
    const store = useAuthStore()

    const [ username, setUsername ] = useState(store.username)
    const [ password, setPassword ] = useState(store.password)
    const [ isCheck, setIsCheck ] = useState(true)

    useEffect(() => {
        navigation.setOptions({
            headerBackVisible: false
        })
    }, [])


    async function handlerSubmit() {
        if (!username) {
            return toast.show('请输入用户名', { duration: 1000 })
        }
        if (!password) {
            return toast.show('请输入密码', { duration: 1000 })
        }
        try {
            toast.loading('登录中...')
            await AuthActions.userLogin({ username, password })
            toast.success('登录成功', { duration: 1000 })
        } catch (error: any) {
            toast.error(error.message || '登录失败')
        }
    }
    
    return (
        <KeyboardDismissWrapper style={ styles.loginWrapper }>

            <Image style={ styles.logo } source={{ uri: 'Logo' }} />

            {/* <Text style={ styles.title }>欢迎登录</Text> */}

            <CellGroup inset={ true }>
                <Field
                    name="username"
                    value={ username }
                    labelWidth={60}
                    label="用户名"
                    placeholder="请输入用户名"
                    onChange={ (v) => setUsername(v.trim()) }
                />

                <Field
                    name="password"
                    type="password"
                    value={ password }
                    labelWidth={60}
                    label="密码"
                    border={false}
                    placeholder="请输入登录密码"
                    onChange={ (v) => setPassword(v.trim()) }
                />
            </CellGroup>

            <View style={ styles.footer }>
                <View style={ styles.checkWrapper }>
                    <Check 
                        style={ styles.checkBox } 
                        value={ isCheck }
                        checkedValue={ true }
                        uncheckedValue={ false }
                        onChange={ setIsCheck }
                    />

                    <Text style={ styles.checkText }>已阅读并同意</Text>

                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                        navigation.navigate('WebPage', Config.agreement)
                    }}>
                        <Text style={ styles.checkTextPrimary }>《用户服务协议》、</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                        navigation.navigate('WebPage', Config.privacy)
                    }}>
                        <Text style={ styles.checkTextPrimary }>《隐私声明》</Text>
                    </TouchableOpacity>

                </View>

                <Button 
                    type="primary" 
                    text="立即登录" 
                    disabled={ !isCheck }
                    onClick={ handlerSubmit }
                />
                <Button 
                    style={ styles.btn } 
                    text="立即注册" 
                    type='text'
                    onClick={ () => {
                        navigation.navigate("Register")
                    }} 
                />
            </View>
        </KeyboardDismissWrapper>
    )
}


export default LoginPage