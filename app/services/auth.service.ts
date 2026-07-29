import axiosInstance from "../interceptor/axios.interceptor";
import * as ApiRoutes from "../routes/api.routes";
import {
    CHANGE_PASSWORD,
    FORGOT_PASSWORD,
    GENERATE_OTP, LOGOUT,
    PRE_REGISTRATION,
    UNSUBSCRIBE,
    USER_LOGIN,
    VALIDATE_OTP,
    VALIDATE_PRE_REGISTRATION, VALIDATE_REFERRAL_CODE
} from "../routes/api.routes";
import { User } from "../http-services/models/request//user.model";
import { NotificationTypes } from "../enums/notificationTypes";
import { Login } from "../http-services/models/request/login.model";
import axios, { AxiosError } from 'axios';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { StatusCodeEnum } from "app/enums/statusCode.enum";



export const loginService = async (login: Login, onSuccess: any, onError: any, onFinal: () => void) => {

    const loginJSON = {
        request: {
            Authenticate: login
        }
    };

    console.log("LOGIN SERVICE CALLING:", ApiRoutes.BASE_URL + USER_LOGIN);

    return await axiosInstance
        .post(USER_LOGIN, loginJSON)
        .then(async response => {
            console.log("LOGIN SERVICE RESPONSE DATA:", JSON.stringify(response.data));

            if (response.data && (response.data.StatusCode === StatusCodeEnum.SUCCESS || response.data.StatusCode === "ER0053")) {
                const user = response.data;
                await AsyncStorage.setItem('user', JSON.stringify(user));

                onSuccess(user);
            } else {
                const statusMsg = response.data ? response.data.StatusMsg : "Unknown error";
                const statusCode = response.data ? response.data.StatusCode : "Unknown code";

                console.log("LOGIN SERVICE API ERROR:", statusCode, statusMsg);

                onError(response.data);
            }
        })
        .catch(error => {
            console.log("LOGIN SERVICE NETWORK ERROR:", error.message);
            if (error.response) {
                console.log("LOGIN SERVICE ERROR RESPONSE:", JSON.stringify(error.response.data));
            }
            onError(error);
        })
        .finally(onFinal)
}
