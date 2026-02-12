import { createBottomTabNavigator,  } from "@react-navigation/bottom-tabs";
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';

import { Icon } from "@/Components/Icon";
import { HeaderBar } from "@/Components/HeaderBar";

import { HomeList } from './HomeList'
import My from './My'
import { useInitDevice } from "@/Hooks";
import { View } from "react-native";
import { PageLayout } from '@/Components/Page'

const Tab = createBottomTabNavigator()
// const Tab = createNativeBottomTabNavigator()

function TabScreen() {

    useInitDevice()

    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: { 
                    backgroundColor: 'transparent' 
                },
                header: (props) => <HeaderBar {...props} />,
            }}
        >
            <Tab.Screen 
                name="HomeList" 
                component={ HomeList } 
                options={{  
                    title: '首页',
                    
                    // tabBarIcon: ({ focused }) => {
                    //     return {
                    //         type: 'image',
                    //         source: {
                    //             uri: focused ? 'IconHomeSel' : 'IconHome'
                    //         },
                    //         tinted: false
                    //     }
                    // }
                    tabBarShowLabel: false,
                    tabBarLabelPosition: 'beside-icon',
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon type="image" name={ focused ? 'HomeSel' : 'Home'  } color={ color } size={ 28 } />
                    },
                }} 
            />

            <Tab.Screen 
                name="My" 
                component={ My } 
                options={{
                    title: '我的',
                    headerShown: false,
                    // tabBarIcon: ({ focused }) => {
                    //     return {
                    //         type: 'image',
                    //         source: {
                    //             uri: focused ? 'IconMySel' : 'IconMy'
                    //         },
                    //         tinted: false
                    //     }
                    // }
                    tabBarShowLabel: false,
                    tabBarLabelPosition: 'beside-icon',
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon type="image" name={ focused ? 'MySel' : 'My'  } color={ color } size={ 28 } />
                    },
                }} 
            />
        </Tab.Navigator>
    )
}

export default TabScreen