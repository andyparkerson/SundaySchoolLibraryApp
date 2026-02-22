import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SAMPLE_BOOKS} from '../data/sampleBooks';

function BooksScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Book Catalogue</Text>
      <FlatList
        data={SAMPLE_BOOKS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.bookItem}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>{item.author}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 12,
  },
  bookItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default BooksScreen;
