import { ComponentType } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderBar } from "@/Components/HeaderBar";
import Setting from "./Setting";
import Live from "./Live";
import { Password, Profile } from "./User";
import PlayEdit from "./PlayEdit";
import UseCard from "./PlayEdit/UseCard";
import Result from './Result'
import { WebPage } from "./Web";

export const Stack = createNativeStackNavigator()

interface StackScreenProps {
    tabScreen?: ComponentType | undefined
}

function StackScreen({ tabScreen }: StackScreenProps ) {
    return (
        <Stack.Navigator 
            screenOptions={{ 
                header:  (props) => <HeaderBar {...props} />,
                headerStyle: { 
                    backgroundColor: 'transparent' 
                },
            }} 
        >
            {/* 主屏 */}
            {
                tabScreen && (
                    <Stack.Screen name="Main" component={ tabScreen } options={{ headerShown: false }} />
                )
            }

            <Stack.Screen name="PlayEdit" component={ PlayEdit } options={{ title: '玩法' }} />
            <Stack.Screen name="UseCard" component={ UseCard } options={{ title: '用牌设置' }} />

            {/* 全局页面 */}
            <Stack.Screen name="Live" component={ Live } options={{  title: '直播', headerTransparent: true, gestureEnabled: false }} />
            
            <Stack.Screen name="Password" component={ Password } options={{  title: '修改密码' }} />
            <Stack.Screen name="Profile" component={ Profile } options={{  title: '账号管理' }} />

            <Stack.Screen name="Setting" component={ Setting } options={{  title: '设置' }} />
            <Stack.Screen name="Result" component={ Result } options={{  title: '结果', gestureEnabled: false }} />


            <Stack.Screen name="WebPage" component={ WebPage } />
        </Stack.Navigator>
    )
}

export default StackScreen