import { useLayoutEffect } from "react";
import { ScrollView } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { SheetManager } from "react-native-actions-sheet";
import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Cell, CellGroup } from "@/Components/Cell";
import { PlayDataAction, GamePlayState, usePlayStore } from "@/Detecter/PlayStore";
import { GameActions, GameState } from "@/Store";
import { Field, FieldNumber } from "@/Components/Field";
import { RightButton } from "@/Components/HeaderBar";
import Switch from "@/Components/Switch";
import { useToast } from "@/Components/Toast";

// 页面参数
interface PlayEditParam {
    title?: string
    data?: GamePlayState
}

interface PlayEditParamList extends ParamListBase {
    PlayEdit: PlayEditParam | undefined
}

// 设置类别
function setCategory(value: number) {
    SheetManager.show('sheet', {
        payload: {
            title: '选择游戏玩法',
            value: value,
            data: GameState.gameType,
            onChange: (value: number) => {
                const data = GameActions.getGameData(value)
                if (!data) {
                    return
                }
                PlayDataAction.setPlayData('gameId', data.gameId)
                PlayDataAction.setPlayData('name', data.name)
                PlayDataAction.setPlayData('handCards', data.handCards)
                PlayDataAction.setPlayData('useCards', data.useCards)
            }
        }
    })
}

// 切牌
function setCutCard(value: string) {
    SheetManager.show('sheet', {
        payload: {
            title: '切牌设置',
            value: value,
            data: GameState.cutCardDict,
            onChange: (value: string) => {
                PlayDataAction.setPlayData('cutCard', value)
            }
        }
    })
}

// 手法设置
function setTrick(value: string) {
    SheetManager.show('sheet', {
        payload: {
            title: '手法设置',
            value: value,
            data: GameState.trickDict,
            onChange: (value: string) =>  PlayDataAction.setPlayData('trick', value)
        }
    })
}

function PlayEdit({ navigation, route }: NativeStackScreenProps<PlayEditParamList, "PlayEdit">) {
    const { params } = route
    const { theme } = useUnistyles()
    const toast = useToast()
    const data = usePlayStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => {
                return (
                    <RightButton 
                        text="保存" 
                        icon="save"
                        onClick={ async () => {
                            const data = PlayDataAction.exportPlayData();
                            if (!data.name) {
                                return toast.info('请填写玩法名称', { duration: 1500 })
                            }
                            toast.loading('保存中...')
                            try {
                                if (data.playId) {
                                    await GameActions.updateGamePlay(data)
                                } else {
                                    delete data.playId
                                    await GameActions.createGamePlay(data)
                                }
                                toast.success('保存成功', { duration: 1000 })
                                navigation.goBack()
                            } catch(err: any) {
                                toast.error('保存失败', { duration: 1000 })
                            }
                        }}
                    />
                )
            }
        })
    }, [])
    
    // 设置页面标题
    useLayoutEffect(() => {
        navigation.setOptions({
            title: params?.title ?? '添加玩法'
        })
    }, [])


    return(
        <ScrollView>
            <CellGroup inset border>
                <Cell label="游戏" isLink
                    content={ GameActions.gameTypeLabel(data.gameId) }
                    onClick={ () => setCategory(data.gameId) }
                />
                <Field 
                    value={ data.name }
                    labelWidth={ 100 }
                    label="玩法名称"
                    align="left"
                    placeholder="请输入"
                    hasClear={ false }
                    border={ false }
                    onChange={ (v) => {
                        PlayDataAction.setPlayData('name', v)
                    }}
                />
            </CellGroup>

            <CellGroup inset border>

                <Cell label="手法设置" isLink
                    content={ GameActions.trickLabel(data.trick) }
                    onClick={ () => setTrick(data.trick) }
                />

                <Cell label="切牌设置" isLink
                    content={ GameActions.cutCardLabel(data.cutCard) }
                    onClick={ () => setCutCard(data.cutCard) }
                />

                <Cell label="用牌设置" isLink
                    content={ `${ data.usedPoker.length }张` }
                    onClick={ () =>  {
                        navigation.navigate('UseCard')
                    }}
                />

                <Cell label="手牌张数">
                    <FieldNumber 
                        min={ 1 }
                        max={ 50 }
                        step={ 1 }
                        value={ data.handCards } 
                        onChange={ v => PlayDataAction.setPlayData('handCards', v) } 
                    />
                </Cell>

                <Cell label="玩家人数" border={ false }>
                    <FieldNumber 
                        min={ 1 }
                        max={ 20 }
                        step={ 1 }
                        value={ data.people } 
                        onChange={ v => PlayDataAction.setPlayData('people', v) } 
                    />
                </Cell>

            </CellGroup>

            <CellGroup inset border>
                <Cell 
                    label='洗牌是否需要洗全'
                    labelWidth={ 200 }
                    border={ false }
                >
                    <Switch
                        value={ data.isShuffleFull }
                        trackColor={{ true: theme.colorPrimary }}
                        ios_backgroundColor={ theme.borderColor }
                        onValueChange={ (value) => {
                            PlayDataAction.setPlayData('isShuffleFull', value)
                        }}
                    />
                </Cell>
            </CellGroup>
        </ScrollView>
    )
}


export default PlayEdit
