import axios from 'axios';

const SERVER_URL_LOCAL = 'http://localhost:3000';

const generateHeaders = (customHeaders) => {
    let headers = customHeaders ? {...customHeaders} : {'Content-Type': 'application/json'};
    const userToken = localStorage.getItem('accessToken');
    if (userToken) {
        headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
    }

    return headers;
};

const createAxiosConfig = (apiSpec, headers, parameters, file) => {
    const url = apiSpec.path.startsWith('http') ? apiSpec.path : SERVER_URL_LOCAL + apiSpec.path;
    const axiosConfig = {
        method: apiSpec.method,
        url,
        headers,
    };

    if (file) {
        axiosConfig.data = createFomrData(parameters, file);
        return axiosConfig;
    }

    if (apiSpec.method.toUpperCase() === 'GET') {
        axiosConfig.params = parameters;
        return axiosConfig;
    } 

    // POST, PATCH, DELETE, etc..
    axiosConfig.data = parameters;
    return axiosConfig;
};

const createFomrData = (parameters, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jsonData', new Blob([JSON.stringify(parameters)], {
        type: "application/json"
    }));
    return formData;
}

const requestWithAxios = async (config) => {
    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.log('에러내용 => ', error);
        if (error.response) {
            const errorData = error.response.data;
            handleErrorByCode(errorData.code);
            return errorData;
        }
        alert('알 수 없는 에러가 발생하였습니다.');
        return error;
    }
};

const handleErrorByCode = (code) => {
    if (code === 500) {
        alert('알 수 없는 에러가 발생하였습니다.');            
    }
};

/**
 * apiCall - 백엔드 서버 API 호출을 위한 유틸리티 함수
 * 
 * @param {Object} apiSpec - apiList.js에서 가져온 API 명세
 * @param {Object} [parameters] - API 호출에 필요한 파라미터 (선택적)
 * @param {Object} [customHeaders] - 사용자 정의 헤더 (선택적)
 * 
 * @returns {Promise} API 호출 결과
 * 
 */
const apiCall = (apiSpec, parameters, customHeaders) => {    
    const headers = generateHeaders(customHeaders);
    const config = createAxiosConfig(apiSpec, headers, parameters);    
    
    return requestWithAxios(config);
};

const apiCallWithFileData = (apiSpec, parameters, file) => {        
    const headers = {'Content-Type': 'multipart/form-data'};
    const config = createAxiosConfig(apiSpec, headers, parameters, file);

    return requestWithAxios(config);
}

export {apiCall, apiCallWithFileData};
