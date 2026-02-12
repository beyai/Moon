import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, FlatList, Image, Linking, Pressable, Text, View } from "react-native";
import { useLayoutEffect } from "react";
import { Button } from "@/Components/Button";
import { DeviceState, GameActions, GameState, useGameStore } from "@/Store";
import { RightButton } from "@/Components/HeaderBar";
import { GamePlayData } from "@/Service/interface";
import { useToast } from "@/Components/Toast";
import { GamePlayState, PlayDataAction } from "@/Detecter/PlayStore";
import { Empty } from "@/Components/Empty";
import { Tool } from "react-native-nitro-moon";
import styles from "./styles";
import { RectButton } from "react-native-gesture-handler";

type ItemProps = {
    item: GamePlayData;
    index: number;
    onClick: (item: any) => void;
    onClickEdit: (item: any) => void;
    onClickDelete: (item: any) => void;
}

function ListItem({
    item,
    index,
    onClick,
    onClickEdit,
    onClickDelete
}: ItemProps) {
    return (
        <Pressable onPress={
            () => onClick(item)
        } style={ styles.item }>

                <View
                    style={ styles.itemWrapper }
                >
                    <Image  style={ styles.img } source={{ uri: item.game?.icon }} resizeMode="contain" />
                    <View style={ styles.header }>
                        <Image  style={ styles.avatar } source={{ uri: item.game?.icon }} resizeMode="contain" />
                        <Text style={ styles.title }>{ item.name }</Text>
                    </View>
                    
                    <View style={ styles.content }>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>游戏：</Text>
                            <Text style={ styles.desc }>{ item.game?.name }</Text>
                        </View>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>手法：</Text>
                            <Text style={ styles.desc }>{ GameActions.trickLabel(item.trick)}</Text>
                        </View>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>用牌：</Text>
                            <Text style={ styles.desc }>{ GameActions.getUsedCardSize(item.useCards) }张</Text>
                        </View>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>切牌：</Text>
                            <Text style={ styles.desc }>{ GameActions.cutCardLabel(item.cutCard) }</Text>
                        </View>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>手牌：</Text>
                            <Text style={ styles.desc }>{ item.handCards }张</Text>
                        </View>
                        <View style={ styles.meta }>
                            <Text style={ styles.label }>玩家人数：</Text>
                            <Text style={ styles.desc }>{ item.people }人</Text>
                        </View>
                        {/* <View style={ styles.tipInfo }>
                            <Text style={ styles.desc }>已设用牌必须洗完整</Text>
                        </View> */}
                    </View>

                    <View style={ styles.footer }>
                        <Button text="修改" size="small" type="text" border onClick={ () =>  onClickEdit(item)} />
                        <Button text="删除" size="small" type="text" border status="error" style={ styles.btn } onClick={ () => onClickDelete(item) } />
                    </View>
                </View>
                {/* <NitroGlassView 
                effect="regular" 
                interactive={ true } 
                style={ styles.item }
            >
            </NitroGlassView> */}
        </Pressable>
    )
}


export function HomeList({ navigation }: NativeStackScreenProps<ParamListBase, "HomeList"> ) {
    const gameStore = useGameStore()
    const toast = useToast()

    useLayoutEffect(() => {
        // 初始化加载配置信息
        if (!GameState.isInit) {
            toast.loading('加载中...')
            GameActions.initFetch().then(() => {
                return GameActions.getGamePlayList()
            }).then(() => {
                toast.hide()
            }).catch(err => {
                toast.error('加载失败')
            })
        }
    }, [])

    // 添加
    function handlerAdd() {
        PlayDataAction.initPlayData()
        navigation.navigate('PlayEdit', { title: '添加玩法' })
    }
    
    // 打开
    function handlerOpen(item: GamePlayState) {
        PlayDataAction.initPlayData(item)
        
        // 验证权限
        if (Tool.getCameraPermissionStatus() == 'authorized') {
            return navigation.navigate('Live')
        }

        // 请求权限
        if (DeviceState.isRequestCamera) {
            Alert.alert(
                '需要相机权限',
                '请在设置中开启相机权限以继续使用',
                [
                    { text: '取消', style: 'cancel' },
                    { text: '去设置', onPress: () => Linking.openURL('app-settings:') }
                ]
            )
            return;
        }

        Tool.requestCameraPermission().then(status => {
            DeviceState.isRequestCamera = true;
            if (status == 'authorized') {
                navigation.navigate('Live')
            }
        })
    }

    // 编辑
    function handlerEdit(item: GamePlayState) {
        PlayDataAction.initPlayData(item)
        navigation.navigate('PlayEdit', { title: '修改玩法' })
    }

    // 删除
    function handlerDelete(item: GamePlayState) {
        Alert.alert('提示', '删除后无法恢复，确定要删除吗？', [
            { text: '取消', style: 'cancel' },
            { 
                text: '删除', style: "destructive", onPress: async () => {
                    try {
                        toast.loading("删除中...")
                        await GameActions.removeGamePlay(item.playId!)
                        toast.hide()
                    } catch {
                        toast.error("删除失败")
                    }
                } 
            },
        ])
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: GameState.playList.length ? () => {
                return (
                    <RightButton icon="add" text="添加" onClick={handlerAdd} />
                )
            } : undefined
        })
    }, [ gameStore.playList ])

    if ( gameStore.playList.length === 0 ) {
        return (
            <Empty title="没有找到任何玩法设置">
                <Button 
                    size="default" 
                    text="添加玩法" 
                    type="primary" 
                    style={{ width: 120 }} 
                    onClick={ handlerAdd }
                />
            </Empty>
        )
    }

    return (
        <FlatList
            style={ styles.list }
            contentContainerStyle={ styles.container }
            showsVerticalScrollIndicator={ false }
            keyExtractor={(item) => { return item.playId! }}
            data={ gameStore.playList }
            renderItem={ (props) => {
                const item = props.item as GamePlayData
                return (
                    <ListItem 
                        item={ item }
                        index={ props.index }
                        onClick={ handlerOpen}
                        onClickEdit={ handlerEdit }
                        onClickDelete={ handlerDelete }
                    />
                )
            }}
        />
    )
}