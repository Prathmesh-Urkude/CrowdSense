import axios from "axios";
import { ENV } from "../configs/env";

const API = axios.create({
  baseURL: ENV.API_URL,
});

export default API;