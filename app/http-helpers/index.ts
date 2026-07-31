
import axios, { AxiosError } from 'axios';

//const navigation = useNavigation();
let request = axios.create({
//  baseURL: 'https://betadev.kashremit.com/CashUIMR.svc/', 
baseURL: 'https://tpinservice.kashremit.com/CashUIMR.svc/',

//  baseURL: 'https://service.kashremit.com/CashUIMR.svc/',
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'origin': '*',
    'referer': '*'
    }
});

request.interceptors.request.use(
  (config) => {
    config.params= {
      ...config.params, 
    }
    return config;
  },
  (error) => {
    genericErrorHandler(error);
    return Promise.reject(error);
  },
);

export const setClientToken = (token :any) => {
  request.interceptors.request.use((config)=> {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

export const genericErrorHandler  =(error: AxiosError<any>)  =>{

  const code = error.response?.status
  if (code ==401) {
    
    //navigation.navigate('Login');

  }
}


export default request;