import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const emojis = [
  "😀",
  "😍",
  "🥳",
  "🤔",
  "😎",
  "🤩",
  "🤓",
  "😇",
  "🤠",
  "👽",
  "👻",
  "🤖",
  "🎃",
  "🦄",
  "🐶",
  "🐱",
  "🐼",
  "🦊",
  "🐸",
  "🦁",
  "🐯",
  "🐨",
  "🐰",
  "🦝",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
];

const windowWidth = Dimensions.get("window").width;

export default function App() {
  const [board, setBoard] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [maxMoves, setMaxMoves] = useState(20);
  const [bestAchievements, setBestAchievements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    initializeBoard();
    loadBestAchievements();
  }, [level]);

  const loadBestAchievements = async () => {
    try {
      const savedAchievements = await AsyncStorage.getItem("bestAchievements");
      if (savedAchievements !== null) {
        setBestAchievements(JSON.parse(savedAchievements));
      }
    } catch (error) {
      console.error("Error loading best achievements:", error);
    }
  };

  const saveBestAchievement = async (achievedLevel) => {
    try {
      const newAchievements = [...bestAchievements, achievedLevel]
        .sort((a, b) => b - a)
        .slice(0, 10);
      await AsyncStorage.setItem(
        "bestAchievements",
        JSON.stringify(newAchievements)
      );
      setBestAchievements(newAchievements);
    } catch (error) {
      console.error("Error saving best achievement:", error);
    }
  };

  const initializeBoard = () => {
    const numPairs = level + 1;
    const shuffledEmojis = [...emojis].sort(() => Math.random() - 0.5);
    const gameEmojis = shuffledEmojis.slice(0, numPairs);
    const gameBoard = [...gameEmojis, ...gameEmojis].sort(
      () => Math.random() - 0.5
    );
    setBoard(gameBoard);
    setSelectedCards([]);
    setMatchedPairs([]);
    setScore(0);
    setMoves(0);
    setMaxMoves(Math.floor(numPairs * 2.5));
  };

  const handleCardPress = (index) => {
    if (
      selectedCards.length === 2 ||
      selectedCards.includes(index) ||
      matchedPairs.includes(index)
    )
      return;

    const newSelectedCards = [...selectedCards, index];
    setSelectedCards(newSelectedCards);

    if (newSelectedCards.length === 2) {
      setMoves(moves + 1);

      if (board[newSelectedCards[0]] === board[newSelectedCards[1]]) {
        setMatchedPairs([...matchedPairs, ...newSelectedCards]);
        setScore(score + 1);
        setSelectedCards([]);

        if (matchedPairs.length + 2 === board.length) {
          saveBestAchievement(level);
          Alert.alert(
            "¡Felicidades!",
            `Has completado el nivel ${level} con ${score + 1} puntos en ${
              moves + 1
            } movimientos. ¿Quieres subir de nivel?`,
            [
              {
                text: "Sí",
                onPress: () => {
                  setLevel(level + 1);
                  initializeBoard();
                },
              },
            ]
          );
        }
      } else {
        setTimeout(() => setSelectedCards([]), 1000);
      }

      if (moves + 1 >= maxMoves) {
        Alert.alert(
          "Fin del Juego",
          `Has alcanzado el límite de ${maxMoves} movimientos. El juego se reiniciará en el nivel 1.`,
          [
            {
              text: "Aceptar",
              onPress: () => {
                setLevel(1);
                initializeBoard();
              },
            },
          ]
        );
      }
    }
  };

  const renderCard = (emoji, index) => {
    const isFlipped =
      selectedCards.includes(index) || matchedPairs.includes(index);
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.card,
          isFlipped && styles.flippedCard,
        ]}
        onPress={() => handleCardPress(index)}
      >
        <Text style={styles.cardText}>{isFlipped ? emoji : "?"}</Text>
      </TouchableOpacity>
    );
  };

  const renderBestAchievement = ({ item, index }) => (
    <Text style={styles.achievementItem}>{`${index + 1}. Level ${item}`}</Text>
  );

  const restartGame = () => {
    setLevel(1);
    initializeBoard();
  };

  const renderBoard = () => {
    const rows = [];
    const numCards = board.length;
    let cardsPerRow;

    if (numCards === 4) {
      cardsPerRow = 2;
    } else if (numCards === 6) {
      cardsPerRow = 3;
    } else if (numCards === 8) {
      cardsPerRow = [3, 3, 2];
    } else if (numCards === 10) {
      cardsPerRow = [4, 4, 2];
    } else {
      cardsPerRow = Math.ceil(Math.sqrt(numCards));
    }

    let cardIndex = 0;
    if (Array.isArray(cardsPerRow)) {
      cardsPerRow.forEach((numCardsInRow, rowIndex) => {
        const rowCards = board.slice(cardIndex, cardIndex + numCardsInRow);
        rows.push(
          <View key={rowIndex} style={styles.row}>
            {rowCards.map((emoji, index) =>
              renderCard(emoji, cardIndex + index)
            )}
          </View>
        );
        cardIndex += numCardsInRow;
      });
    } else {
      for (let i = 0; i < numCards; i += cardsPerRow) {
        const rowCards = board.slice(i, i + cardsPerRow);
        rows.push(
          <View key={i} style={styles.row}>
            {rowCards.map((emoji, index) => renderCard(emoji, i + index))}
          </View>
        );
      }
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juego de Memoria</Text>
      <Text style={styles.score}>Puntuación: {score}</Text>
      <Text style={styles.moves}>
        Movimientos: {moves}/{maxMoves}
      </Text>
      <Text style={styles.level}>Nivel: {level}</Text>
      <View style={styles.board}>{renderBoard()}</View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Ver Mejores Logros</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={restartGame}>
        <Text style={styles.buttonText}>Comenzar Nivel 1</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Mejores Logros</Text>
            <FlatList
              data={bestAchievements}
              renderItem={renderBestAchievement}
              keyExtractor={(item, index) => index.toString()}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000a39",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  score: {
    fontSize: 18,
    marginBottom: 5,
    color: "#fff",
  },
  moves: {
    fontSize: 18,
    marginBottom: 5,
    color: "#fff",
  },
  level: {
    fontSize: 18,
    marginBottom: 20,
    color: "#fff",
  },
  board: {
    justifyContent: "center",
    alignItems: "center",
    width: windowWidth * 0.9,
    aspectRatio: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  card: {
    width: windowWidth * 0.2,
    aspectRatio: 1,
    backgroundColor: "#ddd",
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  cardDark: {
    backgroundColor: "#333",
  },
  flippedCard: {
    backgroundColor: "#aaf",
  },
  cardText: {
    fontSize: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  achievementItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
  },
});
