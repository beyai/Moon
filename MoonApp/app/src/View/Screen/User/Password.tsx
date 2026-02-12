import { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions, ParamListBase } from "@react-navigation/native";
import { Button } from "@/Components/Button";
import { CellGroup } from "@/Components/Cell";
import { Field, KeyboardDismissWrapper } from "@/Components/Field";
import { useToast } from "@/Components/Toast";
import styles from "./styles";
import { AuthActions } from "@/Store";

export function Password({ navigation }:NativeStackScreenProps<ParamListBase, "Password"> ) {
    const toast = useToast()

    const [ oldPassword, setOldPassword ] = useState('')
    const [ newPassword, setNewPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')

    async function handlerSubmit() {

        if (!oldPassword) {
            return toast.show('请输入旧密码', { duration: 1000 })
        }

        if (!newPassword) {
            return toast.show('请输入新密码', { duration: 1000 })
        }
        if (!/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{5,18}$/.test(newPassword)) {
            return toast.show('新密码必然是5-18位字母、数字或特殊字符', { duration: 2000 })
        }

        if (!confirmPassword) {
            return toast.show('请再次输入新密码', { duration: 1000 })
        }
        if (newPassword !== confirmPassword) {
            return toast.show('两次输入的新密码不一致', { duration: 2000 })
        }

        try {
            toast.loading('提交中...')
            await AuthActions.updatePassword({ oldPassword, newPassword })
            toast.success('密码修改成功，请重新登录')
        } catch(error: any) {
            toast.error(error.message)
        }
    }

    return (
        <KeyboardDismissWrapper behavior="padding" style={ styles.wrapper }>
            <CellGroup inset border>
                <Field
                    name="oldPassword"
                    type="password"
                    value={ oldPassword }
                    labelWidth={80}
                    label="旧密码"
                    placeholder="请输入"
                    onChange={ (v) => setOldPassword(v.trim()) }
                />

                <Field
                    name="newPassword"
                    type="password"
                    value={ newPassword }
                    labelWidth={80}
                    label="新密码"
                    placeholder="5-18位字母、数字或特殊字符"
                    onChange={ (v) => setNewPassword(v.trim()) }
                />

                <Field
                    name="confirmPassword"
                    type="password"
                    value={ confirmPassword }
                    labelWidth={80}
                    label="确认密码"
                    placeholder="请再次输入新密码"
                    border={ false }
                    onChange={ (v) => setConfirmPassword(v.trim()) }
                />
            </CellGroup>

            <View style={ styles.footer }>
                <View style={ styles.checkWrapper }>
                </View>
                <Button 
                    type="primary" 
                    text="确定修改" 
                    onClick={ handlerSubmit }
                />
            </View>
        </KeyboardDismissWrapper>
    )
}
