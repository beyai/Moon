import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ParamListBase } from "@react-navigation/native";
import { Button } from "@/Components/Button";
import { CellGroup } from "@/Components/Cell";
import { Field, KeyboardDismissWrapper } from "@/Components/Field";
import { Check } from "@/Components/Check";
import { useToast } from "@/Components/Toast";
import styles from "./styles";
import { AuthActions } from "@/Store";
import Config from "@/Common/Config";

function RegisterPage({ navigation }:NativeStackScreenProps<ParamListBase, "Register"> ) {

    const toast = useToast()

    const [ username, setUsername ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ isCheck, setIsCheck ] = useState(true)

    async function handlerSubmit() {
        if (!username) {
            return toast.show('请输入用户名', { duration: 1000 })
        }
        if (!/^[a-zA-Z0-9_]{5,18}$/.test(username)) {
            return toast.show('用户名必须是5-18位字母、数字或下划线', { duration: 2000 })
        }

        if (!password) {
            return toast.show('请输入登录密码', { duration: 1000 })
        }
        if (!/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{5,18}$/.test(password)) {
            return toast.show('密码必然是5-18位字母、数字或特殊字符', { duration: 2000 })
        }

        if (!confirmPassword) {
            return toast.show('请再次输入密码', { duration: 1000 })
        }
        if (password !== confirmPassword) {
            return toast.show('两次输入的密码不一致', { duration: 2000 })
        }

        try {
            toast.loading('注册中...')
            await AuthActions.userRegister({ username, password })
            toast.success('注册成功')
            navigation.goBack()
        } catch(error: any) {
            toast.error(error.message)
        }

    }

    return (
        <KeyboardDismissWrapper behavior="padding" style={ styles.registerWrapper }>
            <CellGroup inset>
                <Field
                    name="username"
                    value={ username }
                    labelWidth={80}
                    label="用户名"
                    placeholder="5-18位字母、数字或下划线"
                    onChange={ (v) => setUsername(v.trim()) }
                />

                <Field
                    name="password"
                    type="password"
                    value={ password }
                    labelWidth={80}
                    label="密码"
                    placeholder="5-18位字母、数字或特殊字符"
                    onChange={ (v) => setPassword(v.trim()) }
                />

                <Field
                    name="confirmPassword"
                    type="password"
                    value={ confirmPassword }
                    labelWidth={80}
                    label="确认密码"
                    placeholder="请再次输入密码"
                    border={ false }
                    onChange={ (v) => setConfirmPassword(v.trim()) }
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
                    text="立即注册" 
                    disabled={ !isCheck }
                    onClick={ handlerSubmit }
                />
            </View>
        </KeyboardDismissWrapper>
    )
}

export default RegisterPage