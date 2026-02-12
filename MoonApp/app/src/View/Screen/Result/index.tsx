import { FlatList } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import styles from "./styles"
import PokerImg from "@/Components/PokerImg"
import { usePlayStore } from "@/Detecter/PlayStore"
import { useMemo } from "react"


function ResultPage(_: NativeStackScreenProps<ParamListBase, "Result"> ) {
    const { detectionResult }  = usePlayStore()
    const data = useMemo(() => [...detectionResult], [ detectionResult ])
    return (
        <FlatList
            style={ styles.wrapper }
            contentContainerStyle={ styles.container }
            data={ data }
            numColumns={ 10 }
            keyExtractor={ (item, index) => `${item}-${index}` }
            renderItem={ 
                ({ item }) => <PokerImg name={ item } size={ styles.item.width } style={ styles.item } />
            }
        />
    )
}

export default ResultPage