import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const DetailPage = ({route}) => {
    const { item } = route.params;
    console.log("item: ", item);
    const handlePurchase = () => {
        window.alert(`Purchase Successful! You have purchased: ${item.description}`);
      };

    return (
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={item.image} style={styles.image} />
          <Text style={styles.title}>{item.description}</Text>
          <Text style={styles.price}>Price: ${item.price}</Text>
          <Text style={styles.details}>
            This is a detailed description of the item. You can customize this section to include
            additional information about the product, such as its features, specifications, or other
            relevant details.
          </Text>
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <Text style={styles.buttonText}>Purchase</Text>
          </TouchableOpacity>
        </ScrollView>
      );


}

const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
    },
    image: {
      width: '100%',
      height: 300,
      resizeMode: 'contain',
      borderRadius: 10,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: '#333',
    },
    price: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2ecc71',
      marginBottom: 15,
    },
    details: {
      fontSize: 16,
      textAlign: 'justify',
      lineHeight: 24,
      color: '#555',
    },
    errorText: {
      flex: 1,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 18,
      color: '#e74c3c',
    },
    purchaseButton: {
        backgroundColor: '#3498db',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 20,
      },
      buttonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
      },

  });

export default DetailPage;