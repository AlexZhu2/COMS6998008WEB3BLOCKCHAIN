import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

import carouselData from '../components/CarouselData';
import Carousel from '../components/Carousel';

const HomePage = () => {
    return (
        <View>
            <Text style={styles.logoText}>ArtistryX</Text>
            <ScrollView style={styles.pageContainer}>
                {carouselData.map((carousel, index) => (
                <Carousel
                    key={index}
                    category={carousel.category}
                    items={carousel.items}
                />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop: 20,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ff4081',
        textAlign: 'center',
        marginBottom: 16,
        backgroundColor: '#ffe4e6',
        padding: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
  
  });
  

export default HomePage;