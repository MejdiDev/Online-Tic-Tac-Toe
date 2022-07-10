import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAWwtNUpNthi8tH1oL3xtujcj4bly9xMD8",
  authDomain: "tictactoe-c8511.firebaseapp.com",
  projectId: "tictactoe-c8511",
  storageBucket: "tictactoe-c8511.appspot.com",
  messagingSenderId: "903669173734",
  appId: "1:903669173734:web:b1adcaae896b8abe5f9a27",
  measurementId: "G-MJZJPZY1FG"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);