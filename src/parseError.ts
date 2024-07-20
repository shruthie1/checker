import { fetchWithTimeout } from "./fetchWithTimeout";
const notifbot = `https://api.telegram.org/bot5856546982:AAEW5QCbfb7nFAcmsTyVjHXyV86TVVLcL_g/sendMessage?chat_id=${process.env.notifChannel}`

export function parseError(
    err: any,
    prefix?: string,
    sendErr: boolean = true
) {
    let status = 'UNKNOWN';
    let message = 'An unknown error occurred';
    let error = 'UnknownError';
    prefix = `${process.env.clientId} - ${prefix ? prefix : ""}`

    const extractMessage = (data: any) => {
        if (Array.isArray(data)) {
            const messages = data.map((item: any) => extractMessage(item));
            return messages.filter((message) => message !== undefined).join(', ');
        } else if (typeof data === 'string') {
            return data;
        } else if (typeof data === 'object' && data !== null) {
            let resultString = ''
            for (const key in data) {
                const value = data[key]
                if (Array.isArray(data[key]) && data[key].every(item => typeof item === 'string')) {
                    resultString = resultString + data[key].join(', ');
                } else {
                    const result = extractMessage(value);
                    if (result) {
                        resultString = resultString + result;
                    }
                }
            }
            return resultString
        }
        return JSON.stringify(data);
    };

    if (err.response) {
        console.log("Checking in response")
        const response = err.response;
        status =
            response.data?.status ||
            response.status ||
            err.status ||
            'UNKNOWN';
        message =
            response.data?.message ||
            response.data?.errors ||
            response.message ||
            response.statusText ||
            response.data ||
            err.message ||
            'An error occurred';
        error =
            response.data?.error ||
            response.error ||
            err.name ||
            err.code ||
            'Error';
    } else if (err.request) {
        console.log("Checking in request")
        status = err.status || 'NO_RESPONSE';
        message = err.data?.message ||
            err.data?.errors ||
            err.message ||
            err.statusText ||
            err.data ||
            err.message || 'The request was triggered but no response was received';
        error = err.name || err.code || 'NoResponseError';
    } else if (err.message) {
        console.log("Checking in error")
        status = err.status || 'UNKNOWN';
        message = err.message;
        error = err.name || err.code || 'Error';
    } else if (err.errorMessage) {
        status = err.status || 'UNKNOWN';
        message = err.errorMessage;
        error = err.name || err.code || 'Error';
    }

    const msg = `${prefix ? `${prefix} ::` : ""} ${extractMessage(message)} `

    const resp = { status, message: msg, error };
    console.log(resp);
    if (sendErr && !msg.includes("INPUT_USER_DEACTIVATED")) {
        fetchWithTimeout(`${notifbot}&text=${resp.message}`);
    }
    return resp
}