import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface BookCardProps {
  title: string;
  author: string;
  available: boolean;
}

function BookCard({title, author, available}: BookCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.author}>{author}</Text>
      </View>
      <View
        style={[
          styles.badge,
          available ? styles.badgeAvailable : styles.badgeUnavailable,
        ]}>
        <Text style={styles.badgeText}>{available ? 'Available' : 'Out'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAvailable: {
    backgroundColor: '#c8e6c9',
  },
  badgeUnavailable: {
    backgroundColor: '#ffcdd2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BookCard;
