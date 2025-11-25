import Parse from "parse/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Parse.setAsyncStorage(AsyncStorage);

Parse.initialize(
  "GIkhp9KySPIUGhGv0gcrOn16Gq231sM0D1WPSlhG",
  "aziK4U60kw2XsrrxNUmdHJlvZiUtNJtFbzgA09f9"
);

Parse.serverURL = "https://parseapi.back4app.com/";