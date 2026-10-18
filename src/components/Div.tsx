import { StyleSheet, Text, View } from 'react-native'
import React, { ReactNode } from 'react'
import { Dimensions } from 'react-native'

const {width, height} = Dimensions.get("window");
const Div = ({children}: {children: ReactNode}) => {
  return (
    <View style={{backgroundColor: "red", flex:1, paddingTop: height * 6/100, paddingHorizontal: width * 4/100}}>
     {children}
    </View>
  )
}

export default Div

const styles = StyleSheet.create({})