import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';

const Carousel = ({ category, items }) => {
    const navigation = useNavigation();
    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.map((item) => (
            <TouchableOpacity
                key={item.id}
                style={styles.itemContainer}
                onPress={() => navigation.navigate('Detail', { item })}
            >
            <Image source={item.image} style={styles.itemImage} />
            <Text style={styles.itemDescription}>{item.description}</Text>
          </TouchableOpacity>
  
          ))}
        </ScrollView>
      </View>
    );
  };

const styles = StyleSheet.create({
    carouselContainer: {
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemContainer: {
        marginRight: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
        resizeMode: 'cover',
    },
    itemDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: '#555',
        textAlign: 'center',
    },
});

export default Carousel;