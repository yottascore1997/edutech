// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";




export const firebaseConfig = {
  apiKey: "AIzaSyDir-vmz1zsEgE6Xo9PXudEM957QZnxDb0",
  authDomain: "yottascore-6a99f.firebaseapp.com",
  projectId: "yottascore-6a99f",
  storageBucket: "yottascore-6a99f.appspot.com",
  messagingSenderId: "566653108169",
  appId: "1:566653108169:web:05edc8ee6bc8931eba3218", // add your appId from Firebase
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

