import { useEffect, useLayoutEffect, useState } from "react";
import { Alert, Text, TouchableHighlight, TouchableOpacity, View } from "react-native";
import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SwipeItem, SwipeList } from "@/Components/List/SwipeList";
import { RectButton } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";
import { Check } from "@/Components/Check";
import { Icon } from "@/Components/Icon";
import { useToast } from "@/Components/Toast";
import styles from "./styles";

interface ActionProps {
    onEdit?: () => void;
    onDelete?: () => void;
}

interface DataItem {
    id: number;
    title: string;
    desc: string;
}

function RenderAction({ onEdit, onDelete }: ActionProps ) {
    return (
        <View style={ styles.active }>
            <View style={ styles.activeItem }>
                <RectButton activeOpacity={ 0 } style={[ styles.activeEdit ]} onPress={ onEdit }>
                    <Text style={ styles.activeText }>编辑</Text>
                </RectButton>
            </View>
            <View style={ styles.activeItem }>
                <RectButton activeOpacity={ 0 } style={[ styles.activeDelete ]} onPress={ onDelete }>
                    <Text style={ styles.activeText }>删除</Text>
                </RectButton>
            </View>
        </View>
    )
}

function HomePage({ navigation }: NativeStackScreenProps<ParamListBase, "Home"> ) {
    const toast = useToast()
    const { theme } = useUnistyles()
    // 当前激活
    const [ acitveIndex, setActiveIndex ] = useState<number>(0)
    // 当前选择
    const [ selected, setSelected ] = useState<number>(0)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => {
                return (
                    <TouchableOpacity
                        style={ styles.addBtn }
                        activeOpacity={ 0.7 }
                        onPress={ () => {
                            navigation.navigate('PlayEdit', { title: '添加玩法' })
                        }}
                    >
                        <Icon name="plus" style={ styles.addIcon } />
                        <Text style={ styles.addText }>添加</Text>
                    </TouchableOpacity>
                )
            }
        })
    }, [])
    
    // 列表数据
    let [ data, setData ] = useState<DataItem[]>([]);
    async function fetchDataList() {
        try {
            setData([
                { id: 1, title: '德州', desc: '手法：洗牌，用牌：52张，切牌：不切牌' },
                { id: 2, title: '三公', desc: '手法：洗牌，用牌：52张，切牌：不切牌' },
            ])
        } catch(err) {

        } finally {

        }
    }

    useEffect(() => {
        fetchDataList()
    }, [])

    // 编辑
    function handlerEdit(index: number) {
        navigation.navigate('PlayEdit', {
            title: '编辑玩法',
            data:  data[index]
        })
        setActiveIndex(-1)
    }

    // 删除
    function handlerDelete(index: number) {
        Alert.alert('提示', '删除后无法恢复，确定要删除吗？', [
            { text: '取消', style: 'cancel' },
            { 
                text: '删除', style: "destructive", onPress: () => {
                    setData(oldData => {
                        oldData.splice(index, 1)
                        return [...oldData]
                    })
                } 
            },
        ])
    }

    // 渲染行
    function renderItem(item: DataItem, index: number) {
        return (
            <SwipeItem
                isActive={ acitveIndex == index }
                renderActions = { () => {
                    return <RenderAction onEdit={ () => handlerEdit(index) } onDelete={ () => handlerDelete(index) } />
                }}
                onStartDrag = { () => setActiveIndex(index) }
            >
                <TouchableHighlight
                    style={ styles.item }
                    underlayColor={ theme.hoverBgColor }
                    onPress={ () => setSelected(index)}
                >
                    <View style={ styles.itemWrapper }>
                        <Check value={ selected } checkedValue={ index } style={ styles.itemCheck } />
                        <View style={ styles.itemContainer }>
                            <Text style={ styles.itemTitle } numberOfLines={ 1 }>{ item.title }</Text>
                            <Text style={ styles.itemDesc } numberOfLines={ 2 }>{ item.desc }</Text>
                        </View>
                    </View>
                </TouchableHighlight>
            </SwipeItem>
        )
    }

    return (
        <SwipeList 
            data={ data } 
            style={ styles.wrapper }
            renderItem={ renderItem }
        />
    )
}

export default HomePage