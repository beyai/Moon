import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderBar } from "@/Components/HeaderBar";
import Login from "./Login";
import Register from "./Register";
import { WebPage } from "../Screen/Web";
import { PageLayout } from "@/Components/Page";

export const Stack = createNativeStackNavigator()

export default function StackScreen() {
    return (
        <Stack.Navigator
            screenOptions={{ 
                header:  (props) => <HeaderBar {...props} /> 
            }}
        >
            <Stack.Screen name="Login" component={ Login } options={{ 
                title: '登录', 
                headerShown: false,
                headerStyle: { 
                    backgroundColor: 'transparent' 
                } 
            }} />
            <Stack.Screen name="Register" component={ Register } options={{ 
                title: '注册账号',
                headerStyle: { 
                    backgroundColor: 'transparent' 
                }
            }} />

            <Stack.Screen name="WebPage" component={ WebPage } />
            
        </Stack.Navigator>
    )
}