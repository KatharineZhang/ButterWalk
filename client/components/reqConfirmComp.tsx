    import React from 'react';
    import { View, Text } from 'react-native';
    
    const reqConfirmCompo = (props: any) => {
      return (
        <View>
          <Text>Hello, {props.name}!</Text>
          <Text>Your age is: {props.age}</Text>
        </View>
      );
    };
    
    export default reqConfirmCompo;