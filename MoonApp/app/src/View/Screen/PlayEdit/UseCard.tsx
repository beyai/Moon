import { useEffect, useState } from "react"
import { SectionList, Text, View } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RectButton } from "react-native-gesture-handler"
import PokerImg from "@/Components/PokerImg"
import { Poker } from '@/Constraint'
import styles from "./styles"
import { PlayDataAction, usePlayStore } from "@/Detecter/PlayStore"

function UseCard({ navigation }: NativeStackScreenProps<ParamListBase, "UseCard">) {
    const { usedPoker } = usePlayStore()

    // 当前数据
    const [ currentData, setCurrentData ] = useState([...usedPoker])

    useEffect(() => {
        const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
            PlayDataAction.setUsedPoker(currentData)
        })
        return () => {
            unsubscribeBeforeRemove()
        }
    }, [ currentData, navigation ])

    function handlerCurrentData(name: Poker.Name) {
        let arr = currentData.slice()
        let index = arr.indexOf(name)
        if (index >= 0) {
            arr.splice(index, 1)
        } else {
            arr.push(name)
        }
        setCurrentData(arr)
    }

    return (
        <SectionList 
            sections={ Poker.group }
            stickySectionHeadersEnabled={ true }
            keyExtractor={ (item, index) => index.toString() }
            contentContainerStyle={ styles.container }
            renderItem={ ({ item }) => {
                return (
                    <View style={ styles.groupRow }>
                        {
                            item.map((name: Poker.Name, index: number) => {
                                return (
                                    <RectButton key={ name } style={ styles.groupItem } onPress={ () => handlerCurrentData(name)  } >
                                        <PokerImg name={ currentData.includes(name) ? name : 'POKER' } size={ styles.groupItem.width } />
                                    </RectButton>
                                )
                            })
                        }
                    </View>
                )
            }}

            renderSectionHeader={ ({ section }) => {
                return <View  style={ styles.groupHeader }>
                    <Text style={ styles.groupTitle }>{ section.title } </Text>
                </View>
            }}

            renderSectionFooter={() => {
                return (
                    <View style={ styles.groupFooter } />
                )
            }}
        />
    )
}


export default UseCard